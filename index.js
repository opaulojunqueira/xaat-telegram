const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const token = 'TOKEN_TELEGRAM_BOT';
const openaiApiKey = 'TOKEN_OPENAI';

const bot = new TelegramBot(token, { polling: true });
const audioDirectory = './audios/';

async function downloadAudio(fileId, fileName) {
    const response = await bot.getFileStream(fileId);
    const filePath = `${audioDirectory}${fileName}.ogg`;
    const writeStream = fs.createWriteStream(filePath);
    response.pipe(writeStream);
    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
    });
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const voice = msg.voice;
    const audio = msg.audio;

    if (voice) {
        const fileId = msg.voice.file_id;
        const timestamp = Date.now();
        const fileName = `audio_${timestamp}`;
        const filePath = await downloadAudio(fileId, fileName);
        console.log(filePath)
        setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Erro ao excluir o arquivo:', err);
                }
            });
        }, 5 * 1000);
        const formData = new FormData();
        formData.append('model', 'whisper-1');
        formData.append('file', fs.createReadStream(audioDirectory + fileName + '.ogg'));
        try {
            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
            });
            const reply = response.data.text;

            if (reply.toLowerCase().trim().startsWith('pesquisar')) {
                try {
                    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                        model: 'gpt-3.5-turbo',
                        messages: [{ 'role': 'user', 'content': `${reply}` }],
                        temperature: 0.9,
                        max_tokens: 2000,
                    }, {
                        headers: {
                            'Authorization': `Bearer ${openaiApiKey}`,
                        },
                    });
                    const res = response.data.choices[0].message['content'];
                    bot.sendMessage(chatId, '<b>[PESQUISA]:</b> ' + res, {
                        parse_mode: 'HTML'
                    });
                } catch (error) {
                    console.error('Error:', error.message);
                }
                return
            }

            if (reply.toLowerCase().trim().startsWith('imagem')) {
                try {
                    const response = await axios.post('https://api.openai.com/v1/images/generations', {
                        model: 'dall-e-3',
                        prompt: reply,
                        n: 1,
                        size: "1024x1024"
                    }, {
                        headers: {
                            'Authorization': `Bearer ${openaiApiKey}`,
                        },
                    });
                    const res = response.data.data[0].url;
                    bot.sendPhoto(chatId, res, {
                        caption: '<b>[IMAGEM]:</b> "' + reply + '"',
                        parse_mode: 'HTML'
                    });
                } catch (error) {
                    console.error('Error:', error.message);
                }
                return
            }

            bot.sendMessage(chatId, '<b>[TRANSCRIÇÃO]:</b> ' + reply, {
                parse_mode: 'HTML'
            });

        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }
    }

    if (audio) {
        const fileId = msg.audio.file_id;
        const timestamp = Date.now();
        const fileName = `audio_${timestamp}`;
        const filePath = await downloadAudio(fileId, fileName);
        console.log(filePath)
        setTimeout(() => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Erro ao excluir o arquivo:', err);
                }
            });
        }, 5 * 1000);
        const formData = new FormData();
        formData.append('model', 'whisper-1');
        formData.append('file', fs.createReadStream(audioDirectory + fileName + '.ogg'));
        try {
            const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
            });
            const reply = response.data.text;
            bot.sendMessage(chatId, '<b>[TRANSCRIÇÃO]:</b> ' + reply, {
                parse_mode: 'HTML'
            });
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
        }
    }

    if (text) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ 'role': 'user', 'content': `${text}` }],
                temperature: 0.9,
                max_tokens: 2000,
            }, {
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
            });
            const reply = response.data.choices[0].message['content'];
            bot.sendMessage(chatId, '<b>[CHAT]:</b> ' + reply, {
                parse_mode: 'HTML'
            });
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
});
