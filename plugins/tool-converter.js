const converter = require('../data/converter');
const stickerConverter = require('../data/sticker-converter');
const { cmd } = require('../command');

cmd({
    pattern: 'converter',
    alias: ['sticker2img', 'stoimg', 'stickertoimage', 's2i'],
    desc: 'Convert stickers to images',
    category: 'media',
    react: '🖼️',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!message.quoted) {
        return await client.sendMessage(from, {
            text: "✨ *Sticker Converter*\n\nPlease reply to a sticker message\n\nExample: `.converter` (reply to sticker)",
            footer: "Supported formats: WhatsApp stickers (.webp)"
        }, { quoted: message });
    }

    if (message.quoted.mtype !== 'stickerMessage') {
        return await client.sendMessage(from, {
            text: "❌ Only sticker messages can be converted\n\nPlease reply to a sticker message",
            footer: "Try sending or replying with a sticker first"
        }, { quoted: message });
    }

    // Send processing message
    const processingMsg = await client.sendMessage(from, {
        text: "⏳ Converting sticker to image...",
        footer: "This may take a moment for animated stickers"
    }, { quoted: message });

    try {
        const stickerBuffer = await message.quoted.download();
        
        // Validate sticker size
        if (stickerBuffer.length > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('Sticker file is too large (max 10MB)');
        }

        const imageBuffer = await stickerConverter.convertStickerToImage(stickerBuffer);

        await client.sendMessage(from, {
            image: imageBuffer,
            caption: "✅ Sticker converted successfully!",
            mimetype: 'image/png'
        }, { quoted: message });

    } catch (error) {
        console.error('Sticker conversion error:', error);
        
        let errorMessage = "❌ Failed to convert sticker";
        if (error.message.includes('FFmpeg is not installed')) {
            errorMessage += "\n\nServer is missing FFmpeg installation";
        } else if (error.message.includes('file too small')) {
            errorMessage += "\n\nThe sticker file appears corrupted";
        } else if (error.message.includes('too large')) {
            errorMessage += "\n\nSticker is too large (max 10MB)";
        }

        await client.sendMessage(from, {
            text: errorMessage,
            footer: "Please try with a different sticker"
        }, { quoted: message });
    }
});

cmd({
    pattern: 'tomp3',
    desc: 'Convert media to audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🔊 Please reply to a video/audio message*"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "❌ Only video/audio messages can be converted"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 300) {
        return await client.sendMessage(from, {
            text: "⏱️ Media too long (max 5 minutes)"
        }, { quoted: message });
    }

    // Send processing message and store it
    await client.sendMessage(from, {
        text: "🔄 Converting to audio..."
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const audio = await converter.toAudio(buffer, ext);

        // Send result
        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });

    } catch (e) {
        console.error('Conversion error:', e.message);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
    }
});

cmd({
    pattern: 'toptt',
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🗣️ Please reply to a video/audio message*"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "❌ Only video/audio messages can be converted"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 60) {
        return await client.sendMessage(from, {
            text: "⏱️ Media too long for voice (max 1 minute)"
        }, { quoted: message });
    }

    // Send processing message
    await client.sendMessage(from, {
        text: "🔄 Converting to voice message..."
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a';
        const ptt = await converter.toPTT(buffer, ext);

        // Send result
        await client.sendMessage(from, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: message });

    } catch (e) {
        console.error('PTT conversion error:', e.message);
        await client.sendMessage(from, {
            text: "❌ Failed to create voice message"
        }, { quoted: message });
    }
});

