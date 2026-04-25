const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post('/chat', async (req, res) => {
  try {
    const { messages, nativeLang = 'English', targetLang = 'Spanish' } = req.body;
    
    const systemPrompt = {
      role: 'system',
      content: `You are LangTutor, an advanced two-way conversational language tutor.
      The user's native language is ${nativeLang}, and they are learning ${targetLang}.
      
      CRITICAL INSTRUCTION: Your primary reply MUST ALWAYS be entirely written in ${targetLang}! Do NOT answer in English unless English is ${targetLang}.

      RULES:
      1. You MUST respond ONLY with a raw, valid JSON object. Do not include markdown formatting or backticks.
      2. The JSON object must contain exactly three keys:
         - "userTranslation": Translate the user's most recent message into their native language (${nativeLang}). If their message was already in ${nativeLang}, translate it into ${targetLang}.
         - "targetLangReply": Your conversational reply MUST BE STRICTLY WRITTEN IN ${targetLang}. Keep it short (1-2 sentences).
         - "nativeLangTranslation": The exact translation of your "targetLangReply" into their native language (${nativeLang}).`
    };
    
    const apiMessages = [systemPrompt, ...messages.map(m => ({ 
      role: m.role === 'ai' ? 'assistant' : 'user', 
      content: m.content 
    }))];
    
    // Explicitly targeting Groq's active default versatile model to prevent deprecation crashes!
    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400
    });
    
    // Parse the JSON response
    let aiResponseStr = chatCompletion.choices[0]?.message?.content || '{}';
    // Clean potential markdown blocks if AI ignores instructions
    aiResponseStr = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(aiResponseStr);
    
    res.json({ 
      reply: parsedData.targetLangReply || "I'm sorry, I couldn't process that.",
      userTranslation: parsedData.userTranslation || "",
      nativeLangTranslation: parsedData.nativeLangTranslation || ""
    });
  } catch (error) {
    console.error("AI chat error:", error.message || error);
    res.status(500).json({ error: error.message || 'Failed to generate AI response' });
  }
});

router.post('/evaluate-pronunciation', async (req, res) => {
  try {
    const { spokenText, targetText, targetLang = 'Spanish' } = req.body;
    
    if (!spokenText || !targetText) {
      return res.status(400).json({ error: 'Missing spoken text or target text' });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are an AI language pronunciation and grammar evaluator for ${targetLang}.
      The user was supposed to say: "${targetText}"
      Instead, the speech recognition heard: "${spokenText}"
      
      Compare the two texts. Account for minor speech-to-text transcription quirks.
      Return a JSON response evaluating the user's accuracy.
      
      RULES:
      1. ONLY return a raw, valid JSON object without markdown.
      2. The JSON must contain:
         - "score": A number out of 100 representing accuracy.
         - "feedback": Constructive feedback on what they mispronounced or grammar differences.
         - "phoneticGuidance": Phonetic spelling identifying syllable stress and exactly how to say it.
         - "suggestions": A quick tip to say it better in ${targetLang}.`
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [systemPrompt],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300
    });
    
    let aiResponseStr = chatCompletion.choices[0]?.message?.content || '{}';
    aiResponseStr = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(aiResponseStr);
    
    res.json(parsedData);
  } catch (error) {
    console.error("AI Evaluation error:", error.message || error);
    res.status(500).json({ error: 'Failed to evaluate pronunciation' });
  }
});

// Advanced Combines Translation, Grammar Correction, and Suggestions (Token Saver)
router.post('/assistant', async (req, res) => {
  try {
    const { text, nativeLang = 'English', targetLang = 'Spanish' } = req.body;
    
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const systemPrompt = {
      role: 'system',
      content: `You are LangTutor's inline assistant.
      The user typed: "${text}" 
      Their native language is ${nativeLang}. They are learning ${targetLang}.
      
      Determine if the text is in ${nativeLang} or ${targetLang}.
      If in ${nativeLang}, translate it to ${targetLang}.
      If in ${targetLang}, check for grammar mistakes and correct it.
      Provide 2 quick suggestions for what they could say next.
      
      RULES:
      1. ONLY return a raw, JSON object without markdown formatting.
      2. The JSON must contain:
         - "translatedText": The message translated or corrected in ${targetLang}.
         - "correctionInfo": Null if perfect. Otherwise, short grammar correction note.
         - "suggestions": Array of 2 strings (sentences) they could say next in ${nativeLang}.`
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [systemPrompt],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 350
    });
    
    let aiResponseStr = chatCompletion.choices[0]?.message?.content || '{}';
    aiResponseStr = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(aiResponseStr));
  } catch (error) {
    console.error("Assistant Error:", error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Session Review Analytics
router.post('/session-summary', async (req, res) => {
  try {
    const { transcript, nativeLang = 'English', targetLang = 'Spanish' } = req.body;
    
    const systemPrompt = {
      role: 'system',
      content: `You are LangTutor's evaluator. Review this session transcript:
      ${JSON.stringify(transcript)}
      
      The user is learning ${targetLang}. Based on their spoken and typed inputs, generate a session summary.
      
      RULES:
      1. ONLY return a raw JSON object without markdown.
      2. The JSON must contain:
         - "fluencyScore": out of 100
         - "grammarAccuracy": out of 100
         - "vocabularySuggestions": Array of strings (new words to learn based on context)
         - "improvementTips": Short paragraph on what to focus on next.`
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [systemPrompt],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 450
    });
    
    let aiResponseStr = chatCompletion.choices[0]?.message?.content || '{}';
    aiResponseStr = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(aiResponseStr));
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Roleplay Arena Chat
router.post('/roleplay/chat', async (req, res) => {
  try {
    const { scenarioContext, messages, nativeLang = 'English', targetLang = 'Spanish' } = req.body;
    
    const systemPrompt = {
      role: 'system',
      content: `You are an AI character in a roleplay game.
      ${scenarioContext}
      The user is learning ${targetLang}. Their native language is ${nativeLang}.
      
      CRITICAL INSTRUCTION: You MUST strictly stay in character. Keep your replies conversational and natural for the scenario. Do NOT break character. ALWAYS reply entirely in ${targetLang}.
      
      RULES:
      1. You MUST respond ONLY with a raw, valid JSON object. Do not include markdown formatting.
      2. The JSON object must contain exactly three keys:
         - "reply": Your conversational response strictly in ${targetLang}.
         - "translation": The exact translation of your "reply" into their native language (${nativeLang}).
         - "hint": A short hint or suggested response the user could say next in ${targetLang}.`
    };
    
    const apiMessages = [systemPrompt, ...messages.map(m => ({ 
      role: m.role === 'ai' ? 'assistant' : 'user', 
      content: m.content 
    }))];
    
    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400
    });
    
    let aiResponseStr = chatCompletion.choices[0]?.message?.content || '{}';
    aiResponseStr = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(aiResponseStr);
    
    res.json(parsedData);
  } catch (error) {
    console.error("Roleplay chat error:", error.message || error);
    res.status(500).json({ error: error.message || 'Failed to generate AI response' });
  }
});

// SayIt Right - Voice Evaluation
router.post('/sayitright/evaluate', async (req, res) => {
  try {
    const { userSpokenText, originalText, targetLang = 'Spanish' } = req.body;
    
    if (!userSpokenText || !originalText) {
      return res.status(400).json({ error: 'Missing required text fields' });
    }

    const systemPrompt = {
      role: 'system',
      content: `You are the evaluator for the 'SayIt Right' translation game.
      The user was asked to translate this sentence into ${targetLang}: "${originalText}"
      The user spoke: "${userSpokenText}"
      
      Your job is to evaluate their spoken translation. Focus primarily on MEANING. Do not punish them if they used a valid synonym or alternative phrasing instead of a rigid expected sentence.
      
      RULES:
      1. ONLY return a raw, valid JSON object without markdown formatting.
      2. The JSON MUST contain exactly:
         - "score": A number out of 10 based on meaning and grammar. (10 = perfect, 7 = minor mistake but understood, 0 = completely wrong).
         - "isMeaningCorrect": boolean. True if the core meaning is preserved.
         - "mistakes": Array of strings pointing out grammar or vocabulary issues (empty array if perfect).
         - "betterSentence": A perfect, natural way to say it in ${targetLang}.
         - "fluency": A number out of 10 for how natural it sounds.
         - "grammar": A number out of 10 for grammatical correctness.`
    };

    const chatCompletion = await groq.chat.completions.create({
      messages: [systemPrompt],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300
    });
    
    let aiResponseStr = chatCompletion.choices[0]?.message?.content || '{}';
    aiResponseStr = aiResponseStr.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsedData = JSON.parse(aiResponseStr);
    res.json(parsedData);
  } catch (error) {
    console.error("SayItRight Eval error:", error.message || error);
    res.status(500).json({ error: 'Failed to evaluate translation' });
  }
});

module.exports = router;
