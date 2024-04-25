import request from 'request-promise';

import * as dotenv from 'dotenv';
dotenv.config();

const randomIP = () => {
    return Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join('.');

}

const chat_completion = async (message) => {
    request.get({
        url: `https://hercai.onrender.com/v3/hercai?question=${message}`,
        headers: {
            'Content-Type': 'application/json',
            'X-forwarded-for': randomIP()
        }
    })
    .then((res) => {
        const respo = JSON.parse(res);
        return respo?.reply || 'No response';
    })
    .catch((err) => {
        return err.message;
    });
};

const hercai = async (event, api) => {
    if (!event?.body?.trim()) return;

    const regex = new RegExp(`^${process.env.BOT_NAME}\\s`, 'i');
    if (!regex.test((event.body).toLowerCase())) return;
    
    const data = event.body.split(' ');
    data.shift();

    const resp = await chat_completion(data.join(' '));
    api.sendMessage(resp, event.threadID, event.messageID);
};

export { hercai };