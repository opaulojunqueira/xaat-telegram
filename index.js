const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const token = 'TOKEN_TELEGRAM_BOT';
const openaiApiKey = 'TOKEN_OPENAI';

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Check if the message text is not empty
    if (!text) {
        console.error('Empty message text. Ignoring the message.');
        return;
    }

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

        bot.sendMessage(chatId, reply);
    } catch (error) {
        console.error('Error:', error.message);
        // Handle the error gracefully, e.g., notify the user or log it
    }
});
