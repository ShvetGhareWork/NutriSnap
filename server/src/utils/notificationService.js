const Notification = require('../models/Notification');

let ioInstance = null;

const setIo = (io) => {
    ioInstance = io;
};

const createNotification = async ({ userId, title, message, type = 'system', metadata = {} }) => {
    try {
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
            metadata
        });

        if (ioInstance) {
            // Emitting to the specific user's room
            ioInstance.to(userId.toString()).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

module.exports = { setIo, createNotification };
