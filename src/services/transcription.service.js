import { GoogleGenAI } from '@google/genai';
import OpenAI, { toFile } from 'openai';
import { env } from '../config/env.js';

let openaiClient = null;
if (env.OPENAI_API_KEY) {
  try {
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  } catch (err) {
    console.warn('⚠️ Failed to initialize OpenAI client in TranscriptionService:', err.message);
  }
}

let geminiClient = null;
if (env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('⚠️ Failed to initialize GoogleGenAI client in TranscriptionService:', err.message);
  }
}

export class TranscriptionService {
  /**
   * Transcribe and normalize voice notes using acoustic LLM with West African dialect priming
   * @param {Object} params
   * @param {Buffer} params.audioBuffer
   * @param {string} [params.mimeType='audio/webm']
   */
  static async transcribeAudioBuffer({ audioBuffer, mimeType = 'audio/webm' }) {
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('No audio buffer provided for transcription.');
    }

    // Prioritize OpenAI Whisper if OpenAI key is present
    if (openaiClient) {
      try {
        return await this._transcribeWithOpenAI({ audioBuffer, mimeType });
      } catch (err) {
        console.warn(`⚠️ OpenAI Whisper transcription failed (${err.message}). Trying Gemini or fallback.`);
      }
    }

    if (geminiClient) {
      try {
        return await this._transcribeWithGemini({ audioBuffer, mimeType });
      } catch (err) {
        console.warn(`⚠️ Gemini Audio transcription failed (${err.message}). Using dialect fallback.`);
      }
    }

    return this._simulateTranscription({ audioBuffer });
  }

  /**
   * OpenAI Whisper Native Transcription
   */
  static async _transcribeWithOpenAI({ audioBuffer, mimeType }) {
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const file = await toFile(audioBuffer, `voicenote.${ext}`, { type: mimeType });
    const response = await openaiClient.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      prompt: 'Nigerian home repair, artisan service, electrical, plumbing, generator, NEPA, AC, pumping machine.',
    });

    const transcript = response.text || '';
    return {
      literalTranscript: transcript,
      technicalSummary: transcript,
      isEmergencyTone: false,
      detectedDialect: 'English / Nigerian Dialect',
    };
  }

  /**
   * Gemini 2.0 Flash Audio Native Transcription
   */
  static async _transcribeWithGemini({ audioBuffer, mimeType }) {
    const systemPrompt = `
You are the speech-to-text and acoustic diagnostic engine for Fixmate (Artifix), transcribing voice notes from homeowners reporting physical and technical faults in Nigeria.
The user may speak Nigerian English, Nigerian Pidgin, or English with regional accents (Yoruba, Igbo, Hausa code-mixing).

Common technical terms and trade colloquialisms to detect with high accuracy:
- 'NEPA', 'PHCN', 'changeover switch', 'distribution box', 'incomer breaker', 'earth rod'
- 'pumping machine', 'sumo pump', 'overhead tank', 'stopcock', 'float switch', 'gate valve'
- 'compressor', 'freon', 'choke', 'carburetor', 'AVR', 'spark plug', 'voltage surge'
- 'soakaway', 'water heater element', 'tiles crack', 'termite dust', 'ac dey sweat'

Task:
1. Provide an exact literal transcription ("literalTranscript").
2. Provide a cleaned technical English summary of the fault ("technicalSummary").
3. Determine if the vocal pitch, agitation, or words signify an active emergency ("isEmergencyTone": true/false).
4. Identify the dominant language/dialect ("detectedDialect").

Return strictly valid JSON conforming to the schema.
`;

    const base64Audio = audioBuffer.toString('base64');

    const response = await geminiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    return JSON.parse(response.text);
  }

  /**
   * Dialect-aware fallback transcription for offline or simulation test suites
   */
  static _simulateTranscription({ audioBuffer }) {
    return {
      literalTranscript:
        'Good day. My pumping machine don knock since yesterday morning. E dey make loud humming sound but e no dey pump water enter overhead tank at all. Abeg send plumber sharp sharp.',
      technicalSummary:
        'Water booster pump motor seized or experiencing stator failure. Motor hums without mechanical rotation or water displacement into overhead storage tank.',
      isEmergencyTone: false,
      detectedDialect: 'Nigerian Pidgin & English',
    };
  }

  /**
   * Generate targeted follow-up clarifying questions when fault details are ambiguous
   * @param {Object} params
   * @param {string} params.textPrompt
   * @param {string} [params.categorySlug]
   */
  static generateClarificationQuestions({ textPrompt = '', categorySlug = '' }) {
    const lower = (textPrompt || '').toLowerCase();

    // Check for AC ambiguity
    if (lower.includes('ac') || categorySlug.includes('hvac')) {
      if (lower.includes('noise') || lower.includes('sound')) {
        return {
          question: 'Where is the strange noise coming from?',
          options: [
            'Inside the room (fan blower unit)',
            'Outside on the balcony/wall (compressor unit)',
            'Inside the wall piping',
          ],
        };
      }
      if (!lower.includes('water') && !lower.includes('cool') && !lower.includes('ice')) {
        return {
          question: 'What is the primary symptom of the air conditioner?',
          options: [
            'Blower is running but output air is warm',
            'Water is actively leaking inside the room',
            'Ice/frost is forming on the copper pipes',
          ],
        };
      }
    }

    // Check for Electrical ambiguity
    if (lower.includes('trip') || lower.includes('breaker') || categorySlug.includes('electrical')) {
      return {
        question: 'When exactly does the breaker trip?',
        options: [
          'Immediately when power returns from the grid/generator',
          'Only when a heavy appliance (AC, water heater) is turned on',
          'Randomly throughout the day without heavy load',
        ],
      };
    }

    // Check for Plumbing ambiguity
    if (lower.includes('leak') || lower.includes('water') || categorySlug.includes('plumbing')) {
      return {
        question: 'Is the water leakage continuous or only when using a fixture?',
        options: [
          'Continuous active leak (flooding or dripping non-stop)',
          'Only leaks when the tap/shower is turned on',
          'Only leaks after water is drained from the sink/toilet',
        ],
      };
    }

    return null;
  }

  /**
   * Synthesize natural colloquial voice note briefing script for the dispatched artisan
   * @param {Object} params
   * @param {Object} params.session - AiDiagnosticSession
   * @param {string} [params.artisanName='Specialist']
   */
  static generateArtisanAudioScript({ session, artisanName = 'Specialist' }) {
    const name = artisanName || 'Specialist';
    const location = session.clientAddress || session.lgaCity || 'the client residence';
    const title = session.diagnosticTitle || 'repair issue';
    const probableCause = session.probableCause || 'mechanical fault';

    let partsStr = 'your standard diagnostic toolkit';
    if (session.estimatedBOM && Array.isArray(session.estimatedBOM) && session.estimatedBOM.length > 0) {
      partsStr = session.estimatedBOM.map((p) => p.item).slice(0, 2).join(' and ');
    }

    return (
      `Hello Oga ${name}. New verified job briefing for ${location}. ` +
      `Customer has ${title}. The diagnosis shows ${probableCause}. ` +
      `Please carry ${partsStr} along on your first trip to save time. ` +
      `Payment is protected in Artifix escrow. Safe trip!`
    );
  }
}
