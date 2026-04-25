/**
 * Maps a learningLanguage name (as stored in the user profile) to the 
 * corresponding BCP-47 locale tag used by both the Web Speech API
 * (SpeechRecognition.lang / SpeechSynthesisUtterance.lang) and
 * other locale-sensitive APIs.
 */
export function getLangCode(learningLanguage) {
  const map = {
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Italian': 'it-IT',
    'Portuguese': 'pt-PT',
    'Japanese': 'ja-JP',
    'Chinese': 'zh-CN',
    'Korean': 'ko-KR',
    'Hindi': 'hi-IN',
    'Arabic': 'ar-SA',
    'Russian': 'ru-RU',
    'Dutch': 'nl-NL',
    'Turkish': 'tr-TR'
  };
  return map[learningLanguage] || 'en-US';
}
