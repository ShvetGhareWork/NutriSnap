import axios from 'axios';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_NOISEFIT;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET_NOISEFIT;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI_NOISEFIT || 'http://localhost:3000/auth/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'https://www.googleapis.com/auth/fitness.location.read',
];

export const getGoogleAuthUrl = () => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID!,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: SCOPES.join(' '),
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const getGoogleFitTokens = async (code: string) => {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  };

  const response = await axios.post(url, new URLSearchParams(values), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

export const refreshGoogleFitToken = async (refreshToken: string) => {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    client_id: GOOGLE_CLIENT_ID!,
    client_secret: GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  };

  const response = await axios.post(url, new URLSearchParams(values), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
};

export const fetchGoogleFitData = async (accessToken: string, startTimeMillis: number, endTimeMillis: number) => {
  const url = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
  
  const metrics = [
    { name: 'steps', type: 'com.google.step_count.delta' },
    { name: 'calories', type: 'com.google.calories.burned.delta' },
    { name: 'heart_rate', type: 'com.google.heart_rate.bpm' },
    { name: 'active_minutes', type: 'com.google.active_minutes' },
    { name: 'distance', type: 'com.google.distance.delta' },
    { name: 'spo2', type: 'com.google.oxygen_saturation' }
  ];

  const results: any = { bucket: [{ dataset: [] }] };

  await Promise.all(metrics.map(async (metric) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aggregateBy: [{ dataTypeName: metric.type }],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        })
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('UNAUTHORIZED');
      }

      if (response.ok) {
        const data = await response.json();
        if (data.bucket && data.bucket[0]) {
            results.bucket[0].dataset.push(...data.bucket[0].dataset);
        }
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') throw err;
      console.warn(`Metric ${metric.name} fetch failed`);
    }
  }));

  return results;
};
