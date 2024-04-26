import { readFileSync } from 'fs';
import login from 'fca-unofficial';
import { hercai } from './modules/hercai.js';

login({ appState: JSON.parse(readFileSync('appstate.json', 'utf8')) }, (err, api) => {
    if (err) return console.error(err);

    api.setOptions({ listenEvents: true, selfListen: false });

    api.listen(async (err, event) => {
        if (err) return console.error(err);
        switch (event.type) {
            case 'message':
                await hercai(event, api);
                break;
            default:
                break;
        }
    });

});

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});