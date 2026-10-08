# Phase 3: Conversational Voice Loop & Regional Dialect Tuning (Weeks 7 – 9)
## Detailed Engineering & Implementation Plan

---

## 1. Phase Objective & Sociolinguistic Context

### 1.1 Goal
Enable frictionless voice-first diagnostics and two-way audio communication on Fixmate. Homeowners can record a 15–60 second spontaneous voice note describing their problem in colloquial English or Nigerian Pidgin. The system accurately transcribes, interprets domain-specific slang, triggers conversational clarifying questions if details are missing, and generates localized audio summaries for artisans.

### 1.2 Sociolinguistic Domain Mapping
Direct English translation fails when dealing with everyday West African trades. Phase 3 incorporates an acoustic and semantic dictionary mapping colloquial vernacular to technical failure modes:

| Colloquial / Pidgin Expression | Literal Meaning | Technical Fault Classification | Suggested Trade & Skills |
| :--- | :--- | :--- | :--- |
| *"Light dey trip whenever I on AC"* | Electricity trips when AC turns on | Overcurrent trip, grounded compressor, or faulty RCBO | Electrical (Breaker & Load Balancing) |
| *"Gen dey surge / e dey shake well well"* | Generator revs erratically and vibrates | Faulty Automatic Voltage Regulator (AVR), dirty carburetor, governor linkage | Generator Specialist (Small Engines) |
| *"Pumping machine don knock"* | Water pump motor seized or stopped spinning | Burnt motor stator winding, seized mechanical bearing, or dry-run lock | Plumbing & Electrical (Submersible/Booster Pump) |
| *"Tap dey sweat / water dey flow under sink"* | Water leaking from faucet base or pipe joint | Worn spindle rubber washer, failed Teflon tape, or loose compression nut | Plumbing (Fixtures & Leak Isolation) |
| *"AC dey blow normal breeze, e no dey cold"* | AC blower works but output is not cold | Refrigerant leak, faulty run capacitor, or compressor contactor failure | HVAC (Refrigerant & Compressor Diagnostics) |
| *"Suck-away don full / soakaway dey smell"* | Septic tank or soakaway pit is overflowing | Full septic sludge volume or blocked drain inspection chamber | Sanitation & Plumbing (Drainage Clearing) |

---

## 2. Technical Architecture for Audio

```
[Client Microphone]
      │
      │ 1. Web Audio API / MediaRecorder (audio/webm, Opus 32kbps mono)
      ▼
[Client Waveform Visualizer]
      │ Real-time audio canvas animation + Silence auto-pause
      ▼
[Express Multipart Ingestion]
      │ 2. Stream to Memory Buffer
      ▼
[Whisper API / Gemini 2.0 Audio Pipeline]
      │ 3. Primed with Nigerian trade vocabulary glossary
      ▼
[Colloquial Dialect Normalizer]
      │ 4. Map slang to structured technical entities
      ▼
[Confidence Evaluator]
      ├── If Confidence < 0.70 ──▶ [Interactive Clarification Loop (2 Quick Chips)]
      └── If Confidence >= 0.70 ─▶ [Proceed to Phase 1 & 2 Diagnostic Flow]
```

---

## 3. Step-by-Step Implementation Breakdown

### 3.1 Step 1: Frontend Web Audio Capture & Waveform Visualizer (Days 1–3)
Build `frontend/src/components/ai/VoiceNoteRecorder.tsx`:
- Capture microphone stream via `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })`.
- Encode using `MediaRecorder` with `audio/webm;codecs=opus` at 32 kbps to keep audio payload under 300KB for 60 seconds.
- Connect an `AudioContext` and `AnalyserNode` to draw an animated 32-bar visualizer showing speech activity.
- Add auto-stop safety limit after 90 seconds.

---

### 3.2 Step 2: Speech-to-Text Pipeline with Vocabulary Priming (Days 4–6)
Implement `src/services/transcription.service.js`:

```javascript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class TranscriptionService {
  /**
   * Transcribe and normalize voice notes
   */
  static async transcribeAudioBuffer(audioBuffer, mimeType = 'audio/webm') {
    const systemPrompt = `
You are the speech-to-text engine for Fixmate, transcribing voice notes from clients reporting home maintenance problems in Nigeria.
The user may speak Nigerian English, Nigerian Pidgin, or standard English with regional accents.
Common terms to identify accurately:
- 'NEPA', 'PHCN', 'changeover switch', 'distribution box', 'incomer breaker', 'earth rod'
- 'pumping machine', 'sumo pump', 'overhead tank', 'stopcock', 'float switch'
- 'compressor', 'freon', 'choke', 'carburetor', 'AVR', 'spark plug'
- 'soakaway', 'water heater element', 'tiles crack', 'termite dust'

Task:
1. Provide an exact literal transcription.
2. Provide a clean English summary extracting the mechanical symptoms.
3. Identify if the user's tone indicates panic or emergency.
`;

    const base64Audio = audioBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType,
                data: base64Audio
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            literalTranscript: { type: 'string' },
            technicalSummary: { type: 'string' },
            isEmergencyTone: { type: 'boolean' },
            detectedDialect: { type: 'string' }
          },
          required: ['literalTranscript', 'technicalSummary', 'isEmergencyTone']
        }
      }
    });

    return JSON.parse(response.text);
  }
}
```

---

### 3.3 Step 3: Interactive Clarification Loop (Days 7–10)
If the audio note is too brief or ambiguous (e.g., *"My AC is just making noise"*):
1. The AI flags `requiresClarification = true`.
2. Generates two targeted diagnostic follow-up options:
   * Question: *"Where is the noise coming from?"*
   * Option A: *"Inside the room (fan unit)"*
   * Option B: *"Outside on the balcony/wall (compressor)"*
3. The frontend displays these as clickable chips without requiring the user to type long sentences.
4. Client's answer is appended to the diagnostic context before running final artisan matching.

---

### 3.4 Step 4: Two-Way Multimodal Audio Bridge for Artisans (Days 11–13)
When an artisan receives a job assignment, provide an audio briefing:
- Generate an AI voice note (TTS) synthesizing the client's complaint into a 25-second colloquial briefing:
  * *"Hello Oga Sunday. Job update for Surulere: Customer has a 1.5HP Panasonic inverter AC. Blower is running but not cooling. Suspected failed capacitor. Please carry 35uF dual capacitor and manifold gauge."*
- Deliver audio file via Fixmate Artisan WhatsApp notification or in-app audio player.

---

### 3.5 Step 5: Testing & Dialect Robustness Benchmark (Days 14–15)
- Record 50 synthetic and real voice samples across diverse accents (Lagos street Pidgin, formal corporate English, Nigerian-British accent, regional phrasing).
- Evaluate Word Error Rate (WER) and Semantic Accuracy (whether the correct failure mode was extracted despite phonetic variations).
- Target: $> 94\%$ semantic classification accuracy.

---

## 4. Phase 3 Deliverables Checklist

- [ ] Frontend `VoiceNoteRecorder` component with live animated waveform.
- [ ] Server-side Whisper / Gemini Audio transcription service active.
- [ ] Nigerian Pidgin and West African repair terminology priming active.
- [ ] Interactive 2-click Clarification Loop implemented for ambiguous inputs.
- [ ] Artisan Audio Briefing generator live.
