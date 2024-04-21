import { readFileSync, writeFileSync, existsSync } from 'fs';
import OpenAIApi from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

let convo_data = [];

const create_prompt = async (senderID, message) => {
    if (existsSync(`./conversations/${senderID}.json`)) {
        convo_data = JSON.parse(readFileSync(`./conversations/${senderID}.json`, 'utf8'));
        convo_data.push({ role: 'user', content: message });
    } else {
        writeFileSync(`./conversations/${senderID}.json`, JSON.stringify([{ role: 'system', content: 'Welcome! I am here to assist you.' }, { role: 'user', content: message }]), 'utf8');
    }
};

const chat_completion = async (message, senderID) => {
    const openai = new OpenAIApi({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const { completion } = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: convo_data
    });

    const answer = completion?.choices?.[0]?.message?.content;

    convo_data.push({ role: 'assistant', content: answer });
    writeFileSync(`./conversations/${senderID}.json`, JSON.stringify(convo_data), 'utf8');

    return answer ? answer.trim() : completion?.error.message ?? 'Failed to get a response.';
};

const gpt = async (event, api) => {
    if (!event?.body?.trim()) return;

    const regex = new RegExp(`^${process.env.BOT_NAME}\\s`, 'i');
    if (!regex.test(event.body)) return;

    const data = event.body.split(' ');
    data.shift();

    await create_prompt(event.senderID, data.join(' '));

    const resp = await chat_completion(data.join(' '), event.senderID);
    api.sendMessage(resp, event.threadID, event.messageID);
};

export { gpt };