import { readFileSync, writeFileSync, existsSync } from 'fs';
import OpenAIApi from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

let convo_data = [];
let SENDERID = '';
let THREADID = '';
let MESSAGEID = '';

const create_prompt = async (senderID, message) => {
    if (existsSync(`./conversations/${senderID}.json`)) {
        convo_data = JSON.parse(readFileSync(`./conversations/${senderID}.json`, 'utf8'));
        convo_data.push({ role: 'user', content: message });
    } else {
        writeFileSync(`./conversations/${senderID}.json`, JSON.stringify([{ role: 'system', content: 'I am Zelix, a messenger bot powered by the OpenAI GPT-4 engine. I am programmed by Justine Agcanas.' }, { role: 'user', content: message }]), 'utf8');
    }
};

const chat_completion = async (senderID, message) => {
    await create_prompt(SENDERID, message);

    const openai = new OpenAIApi({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: convo_data.length === 0 ? [{ role: 'system', content: 'I am Zelix, a messenger bot powered by the OpenAI GPT-4 engine. I am programmed by Justine Agcanas.' }, { role: 'user', content: message }] : convo_data
    });

    const answer = completion?.choices?.[0]?.message?.content;

    convo_data.push({ role: 'assistant', content: answer });
    writeFileSync(`./conversations/${senderID}.json`, JSON.stringify(convo_data), 'utf8');

    return answer ? answer.trim() : completion?.error ?? 'Failed to get a response.';
};

const reset_conversation = async (senderID) => {
    convo_data = [{ role: 'system', content: 'Welcome! I am here to assist you.' }];
    writeFileSync(`./conversations/${senderID}.json`, JSON.stringify(convo_data), 'utf8');
}

const gpt = async (event, api) => {
    SENDERID = event.senderID;
    THREADID = event.threadID;
    MESSAGEID = event.messageID;

    if (!event?.body?.trim()) return;

    const regex = new RegExp(`^${process.env.BOT_NAME}\\s`, 'i');
    if (!regex.test(event.body)) return;

    const data = event.body.split(' ');
    data.shift();

    if (data.join(' ').toLowerCase() === 'reset') {
        await reset_conversation(SENDERID);
        api.sendMessage('Conversation reset.', THREADID, MESSAGEID);
        return;
    }

    const resp = await chat_completion(SENDERID, data.join(' '));
    api.sendMessage(resp, THREADID, MESSAGEID);
}; 

export { gpt };