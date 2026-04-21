import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchGoogleFitData, refreshGoogleFitToken } from '@/lib/googleFit';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('gf_access_token')?.value;
  const refreshToken = cookieStore.get('gf_refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: 'Not connected to Google Fit' }, { status: 401 });
  }

  // If no access token but have refresh token, try to refresh
  if (!accessToken && refreshToken) {
    try {
      const tokens = await refreshGoogleFitToken(refreshToken);
      accessToken = tokens.access_token;
      
      // Update access token cookie
      cookieStore.set('gf_access_token', accessToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expires_in,
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return NextResponse.json({ error: 'Session expired, please reconnect' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = now.getTime();

    // For sleep, we might want the last 24 hours or specifically since yesterday evening
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).getTime();

    const data = await fetchGoogleFitData(accessToken!, startOfDay, endOfDay);
    
    // Process the data into a friendly format
    const stats: any = {
      steps: 0,
      calories: 0,
      heartRate: 0,
      spo2: 0,
      activeMinutes: 0,
      distance: 0,
      sleep: 0,
    };

    console.log('[FITNESS API] RAW DATA BUCKETS:', data.bucket?.[0]?.dataset?.length || 0);

    if (data.bucket && data.bucket[0]?.dataset) {
      data.bucket[0].dataset.forEach((ds: any) => {
        const streamId = ds.dataSourceId || '';
        if (ds.point && ds.point.length > 0) {
          console.log(`Processing Source: ${streamId} (${ds.point.length} points)`);
          ds.point.forEach((point: any) => {
            const value = point.value?.[0];
            if (!value) return;

            if (streamId.includes('step_count')) {
              stats.steps += (value.intVal || 0);
            } else if (streamId.includes('calories')) {
              // Calories can be fpVal
              stats.calories += Math.round(value.fpVal || value.intVal || 0);
            } else if (streamId.includes('heart_rate')) {
              // Get latest heart rate
              const hr = value.fpVal || value.intVal || 0;
              if (hr > 0) stats.heartRate = Math.round(hr);
            } else if (streamId.includes('oxygen_saturation')) {
              stats.spo2 = Math.round((value.fpVal || 0) * 100) || 0;
            } else if (streamId.includes('active_minutes')) {
              stats.activeMinutes += (value.intVal || 0);
            } else if (streamId.includes('distance')) {
              stats.distance += Math.round((value.fpVal || 0) / 1000 * 100) / 100;
            }
          });
        }
      });
    }

    // Secondary fetch for sleep specifically
    try {
      const sleepData = await fetchGoogleFitData(accessToken!, yesterday, endOfDay);
      if (sleepData.bucket && sleepData.bucket[0]?.dataset) {
          const sleepDs = sleepData.bucket[0].dataset.find((ds: any) => 
            ds.dataSourceId?.includes('sleep') || ds.dataSourceId?.includes('activity.segment')
          );
          
          if (sleepDs && sleepDs.point) {
              let totalSleepMillis = 0;
              sleepDs.point.forEach((p: any) => {
                  const activityType = p.value?.[0]?.intVal;
                  if (activityType === 72 || activityType === 109 || activityType === 110 || activityType === 111 || activityType === 112) {
                      totalSleepMillis += (Number(p.endTimeNanos) - Number(p.startTimeNanos)) / 1000000;
                  }
              });
              stats.sleep = Math.round(totalSleepMillis / (1000 * 60 * 60) * 10) / 10;
          }
      }
    } catch (e) {
      console.warn('Sleep fetch failed');
    }

    console.log('[FITNESS API] FINAL STATS:', stats);
    return NextResponse.json(stats);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      const cookieStore = await cookies();
      cookieStore.delete('gf_access_token');
      cookieStore.delete('gf_refresh_token');
      return NextResponse.json({ error: 'Connection lost, please reconnect' }, { status: 401 });
    }
    
    console.error('[FITNESS API ERROR]:', error.message);
    return NextResponse.json({ error: 'Failed to fetch fitness data' }, { status: 500 });
  }
}
