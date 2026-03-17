package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/bisosad1501/DATN/services/ai-service/internal/models"
)

type OpenAIClient struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

func NewOpenAIClient(apiKey string) *OpenAIClient {
	if apiKey == "" {
		return nil
	}
	return &OpenAIClient{
		APIKey:  apiKey,
		BaseURL: "https://api.openai.com/v1",
		HTTPClient: &http.Client{
			Timeout: 120 * time.Second, // Long timeout for AI processing
		},
	}
}

// TranscribeAudio transcribes audio using Whisper API
func (c *OpenAIClient) TranscribeAudio(audioURL string, audioData []byte) (*models.OpenAITranscription, error) {
	if c == nil {
		return nil, fmt.Errorf("OpenAI client not initialized (missing API key)")
	}

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add audio file
	part, err := writer.CreateFormFile("file", "audio.mp3")
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := part.Write(audioData); err != nil {
		return nil, fmt.Errorf("failed to write audio data: %w", err)
	}

	// Add form fields
	writer.WriteField("model", "whisper-1")
	writer.WriteField("language", "en")
	writer.WriteField("response_format", "verbose_json")
	writer.WriteField("timestamp_granularities[]", "word")
	writer.Close()

	// Create request
	req, err := http.NewRequest("POST", c.BaseURL+"/audio/transcriptions", body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Send request
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error: %s - %s", resp.Status, string(bodyBytes))
	}

	// Parse response - OpenAI returns verbose_json format
	var transcriptResponse struct {
		Text     string  `json:"text"`
		Duration float64 `json:"duration"`
		Words    []struct {
			Word  string  `json:"word"`
			Start float64 `json:"start"`
			End   float64 `json:"end"`
		} `json:"words"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&transcriptResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert to our model
	transcript := &models.OpenAITranscription{
		Text:     transcriptResponse.Text,
		Duration: transcriptResponse.Duration,
	}

	// Convert words
	transcript.Words = make([]struct {
		Word  string  `json:"word"`
		Start float64 `json:"start"`
		End   float64 `json:"end"`
	}, len(transcriptResponse.Words))
	copy(transcript.Words, transcriptResponse.Words)

	return transcript, nil
}

// EvaluateWriting evaluates writing using GPT-4
func (c *OpenAIClient) EvaluateWriting(taskPromptText, essayText string, wordCount, timeSpent int) (*models.OpenAIWritingEvaluation, error) {
	if c == nil {
		return nil, fmt.Errorf("OpenAI client not initialized (missing API key)")
	}

	// Create evaluation prompt
	evaluationPrompt := fmt.Sprintf(`[Writing Task]
%s

<Student's Essay>
%s

[Word count: %d | Time taken: %ds]`, taskPromptText, essayText, wordCount, timeSpent)

	systemPrompt := `You are an official IELTS Writing examiner.
You will be given a writing task and a student's essay.
Your job is to evaluate the essay exactly as in an IELTS Writing test.

Follow the official IELTS Writing Band Descriptors strictly.
Provide detailed, constructive feedback and a final band score.

Your output must be in this format:

### Evaluation

**1. Task Achievement / Task Response (0–9):**
- [Give score and explain how well the essay addresses the task, supports ideas, and maintains relevance.]

**2. Coherence and Cohesion (0–9):**
- [Give score and analyze organization, logical flow, paragraphing, and use of linking devices.]

**3. Lexical Resource (0–9):**
- [Give score and describe vocabulary range, precision, collocations, and appropriateness.]

**4. Grammatical Range and Accuracy (0–9):**
- [Give score and explain sentence variety, grammatical control, and error frequency.]

### Overall Band: [average rounded to nearest 0.5]

### Examiner Feedback:
[Provide a natural, 3–4 sentence summary of strengths and areas for improvement, written like a real IELTS examiner.]

### Additional Analysis:
**Strengths:**
- [List 2-3 specific strengths in Vietnamese]

**Areas for Improvement:**
- [List 2-3 specific areas with actionable advice in Vietnamese]

IMPORTANT: Return your response in JSON format with this exact structure:
{
    "overall_band": float (average band rounded to nearest 0.5),
    "criteria_scores": {
        "task_achievement": float,
        "coherence_cohesion": float,
        "lexical_resource": float,
        "grammatical_range": float
    },
    "detailed_feedback": {
        "task_achievement": {
            "vi": "Phân tích chi tiết về cách bài viết đáp ứng yêu cầu đề bài, hỗ trợ ý tưởng và duy trì sự liên quan. Bao gồm các ví dụ cụ thể từ bài viết.",
            "en": "Detailed analysis covering how well the essay addresses the task, supports ideas, and maintains relevance. Include specific examples from the essay."
        },
        "coherence_cohesion": {
            "vi": "Phân tích chi tiết về tổ chức, luồng logic, đoạn văn và việc sử dụng các từ nối. Bao gồm các ví dụ cụ thể.",
            "en": "Detailed analysis of organization, logical flow, paragraphing, and use of linking devices. Include specific examples."
        },
        "lexical_resource": {
            "vi": "Phân tích chi tiết về phạm vi từ vựng, độ chính xác, collocation và tính phù hợp. Làm nổi bật các lựa chọn từ cụ thể.",
            "en": "Detailed analysis of vocabulary range, precision, collocations, and appropriateness. Highlight specific word choices."
        },
        "grammatical_range": {
            "vi": "Phân tích chi tiết về sự đa dạng câu, kiểm soát ngữ pháp và tần suất lỗi. Chỉ ra các cấu trúc cụ thể.",
            "en": "Detailed analysis of sentence variety, grammatical control, and error frequency. Point out specific structures."
        }
    },
    "examiner_feedback": "A natural, 3-4 sentence summary written like a real IELTS examiner, covering strengths and areas for improvement.",
    "strengths": ["specific strength 1 in Vietnamese", "specific strength 2 in Vietnamese"],
    "areas_for_improvement": ["specific area 1 with actionable advice in Vietnamese", "specific area 2 with actionable advice in Vietnamese"]
}

Guidelines:
- Be specific and reference actual content from the essay
- Scores must reflect official IELTS band descriptors (0-9 scale, use .0 or .5 increments)
- All detailed feedback and lists should be in Vietnamese
- Examiner feedback should be natural and encouraging but honest
- Overall band = average of 4 criteria, rounded to nearest 0.5`

	// Prepare request payload
	payload := map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role":    "user",
				"content": evaluationPrompt,
			},
		},
		"temperature":     0.3,
		"response_format": map[string]string{"type": "json_object"},
	}

	eval := &models.OpenAIWritingEvaluation{}
	_, err := c.callChatAPI(payload, eval)
	if err != nil {
		return nil, err
	}
	return eval, nil
}

// EvaluateSpeaking evaluates speaking using GPT-4
func (c *OpenAIClient) EvaluateSpeaking(part string, promptText, transcriptText string, wordCount int, duration float64) (*models.OpenAISpeakingEvaluation, error) {
	if c == nil {
		return nil, fmt.Errorf("OpenAI client not initialized (missing API key)")
	}

	partNames := map[string]string{
		"part1": "Part 1 (Introduction and Interview)",
		"part2": "Part 2 (Long Turn)",
		"part3": "Part 3 (Two-way Discussion)",
	}
	partName := partNames[part]
	if partName == "" {
		partName = "a section"
	}

	// Create evaluation prompt with detailed context and step-by-step instructions
	evaluationPrompt := fmt.Sprintf(`=== IELTS SPEAKING %s EVALUATION ===

QUESTION/PROMPT GIVEN TO STUDENT:
"%s"

STUDENT'S ANSWER (transcribed from audio):
"%s"

EVALUATION METADATA:
- Part: %s
- Duration: %.1f seconds
- Word count: %d words

EVALUATION TASK (Follow these steps carefully):

STEP 1: TOPIC RELEVANCE ANALYSIS
- Compare the question/prompt with the student's answer
- Determine relevance: [On-topic] / [Partially relevant] / [Off-topic] / [No answer]
- If off-topic, analyze WHY: Did the student misunderstand? Avoid the topic? Confused?
- Note specific reasons for your classification

STEP 2: LANGUAGE SKILLS EVALUATION (Independent of topic relevance)
Evaluate each criterion based on what the student ACTUALLY said, regardless of topic:

A. GRAMMAR ANALYSIS:
   - Count grammatical errors (if any)
   - Identify sentence structures: simple, compound, complex
   - Assess tense usage and accuracy
   - Note specific structures used (e.g., conditional, passive, relative clauses)
   - Provide specific examples from the transcript

B. VOCABULARY ANALYSIS:
   - Identify specific words used
   - Assess vocabulary range: basic, intermediate, advanced
   - Look for idiomatic expressions, collocations
   - Note any inappropriate word choices
   - Provide specific examples from the transcript

C. FLUENCY ANALYSIS:
   - Assess sentence flow and naturalness
   - Identify linking devices used (if any)
   - Note repetition or self-correction
   - Evaluate pace and coherence
   - If off-topic, still evaluate fluency aspects (pace, linking devices) separately from topic development

D. PRONUNCIATION INDICATORS:
   - Infer from sentence structure and clarity
   - Note word usage patterns that indicate clarity
   - Assess naturalness of expression
   - Remember: Actual pronunciation cannot be fully assessed from text alone

STEP 3: SCORING
- Apply official IELTS band descriptors strictly
- Use 0.5 increments (e.g., 5.0, 5.5, 6.0, 6.5, 7.0)
- IMPORTANT: ALL scores must be > 0.0 if transcript has meaningful content
- Only use 0.0 if: empty transcript, <5 words, or completely incomprehensible
- Minimum score for meaningful English: 3.0-4.0 (even if very basic)

STEP 4: CONSTRUCTIVE FEEDBACK
- Highlight specific strengths with examples
- Identify specific weaknesses with examples
- Provide actionable advice for improvement
- If off-topic: Acknowledge this but also highlight language skills demonstrated

IMPORTANT REMINDERS:
1. Even if the answer is completely off-topic, you MUST still evaluate language skills fairly
2. Topic relevance affects ONLY "Fluency & Coherence - Topic Development", not other criteria
3. Always cite specific examples from the transcript for each criterion
4. Be fair, accurate, and constructive in your evaluation`, part, promptText, transcriptText, partName, duration, wordCount)

	systemPrompt := `You are an official IELTS Speaking examiner. 
You will receive a student's spoken answers (converted to text) and the questions they were responding to. 
Your task is to evaluate the answers as if they were given in a real IELTS Speaking test.

Follow the IELTS Speaking band descriptors strictly and provide detailed, specific evaluation.

CRITICAL EVALUATION RULES:
1. **ALWAYS evaluate language skills**: Even if the student's answer does not directly address the question or seems off-topic, you MUST still evaluate their language skills (grammar, vocabulary, pronunciation, fluency) based on what they actually said. Only use 0.0 if there is NO answer or the transcript is empty/incomprehensible.
2. **Fluency & Coherence**: If the answer doesn't address the question, you may reduce the score for "topic development" and "coherence" (how well it connects to the question), but still evaluate pace, pauses, and linking devices based on the actual speech.
3. **Lexical Resource**: Evaluate vocabulary range, word choice, and expressions based on the transcript, regardless of topic relevance.
4. **Grammatical Range**: Evaluate sentence structures, tense usage, and grammar accuracy based on the transcript, regardless of topic relevance.
5. **Pronunciation**: Evaluate based on transcript indicators of clarity and naturalness. Note that actual pronunciation cannot be fully assessed from text alone, but you can infer from sentence structure and clarity.

6. **DETAILED ANALYSIS REQUIRED**:
   - For each criterion, provide SPECIFIC examples from the transcript
   - Count actual errors, identify specific structures, note specific vocabulary
   - Analyze sentence complexity, variety, and accuracy
   - Identify strengths and weaknesses with concrete evidence

Your evaluation process:

STEP 1: TOPIC RELEVANCE ANALYSIS
- Compare the question/prompt with the transcript
- Determine: On-topic / Partially relevant / Off-topic / No answer
- Note specific reasons for off-topic classification

STEP 2: LANGUAGE SKILLS EVALUATION (Independent of topic)
- Analyze grammar: Count errors, identify structures, assess complexity
- Analyze vocabulary: Identify word choices, range, appropriateness, collocations
- Analyze fluency: Assess sentence flow, linking devices, natural pauses
- Analyze pronunciation indicators: Infer from sentence structure, clarity, word usage

STEP 3: CRITERIA SCORING
- Apply official band descriptors strictly
- Use 0.5 increments (e.g., 6.0, 6.5, 7.0, 7.5)
- Ensure scores reflect actual language proficiency, not just topic relevance

STEP 4: CONSTRUCTIVE FEEDBACK
- Highlight what was done well with specific examples
- Identify areas for improvement with actionable advice
- If off-topic: Explain why, suggest how to stay on topic, but also acknowledge language skills

Your output format:

### Evaluation

**1. Fluency and Coherence (0–9):**
- Score: [X.X]
- Topic Relevance: [On-topic / Partially relevant / Off-topic / No answer]
- Analysis: [Detailed analysis covering: pace, pauses, coherence, linking devices, topic development. If off-topic, explain why and how it affects coherence, but still evaluate fluency aspects like pace and linking devices. Provide specific examples from transcript.]

**2. Lexical Resource (0–9):**
- Score: [X.X]
- Analysis: [Detailed analysis covering: vocabulary range, word choices, idiomatic expressions, collocations, appropriateness. Evaluate based on actual words used, regardless of topic. Count specific vocabulary examples. Note any inappropriate word choices with examples. Provide specific word choices from transcript.]

**3. Grammatical Range and Accuracy (0–9):**
- Score: [X.X]
- Analysis: [Detailed analysis covering: sentence structures (simple, compound, complex), tense usage, grammatical errors. Count errors, identify specific structures used, assess complexity. Evaluate based on actual grammar in transcript, regardless of topic. Provide specific examples of structures and errors.]

**4. Pronunciation (0–9):**
- Score: [X.X]
- Analysis: [Analysis based on transcript indicators: word stress patterns (inferred from context), sentence rhythm (inferred from structure), clarity of expression. Note: Actual pronunciation cannot be fully assessed from text, but infer from sentence structure, clarity, and word usage patterns. Provide specific observations.]

### Overall Band: [average of 4 criteria, rounded to nearest 0.5]

### Examiner Feedback:
[Provide a comprehensive 4-5 sentence summary in Vietnamese, written like a real IELTS examiner. Structure:
1. Overall assessment (what band and why)
2. Main strengths with specific examples
3. Main areas for improvement with specific examples
4. Actionable advice for reaching next band level
5. If off-topic: Acknowledge this but also highlight language skills shown]

IMPORTANT: Return your response in JSON format with this exact structure:
{
    "overall_band": float (average band rounded to nearest 0.5),
    "criteria_scores": {
        "fluency_coherence": float,
        "lexical_resource": float,
        "grammatical_range": float,
        "pronunciation": float
    },
    "detailed_feedback": {
        "fluency_coherence": {
            "score": float,
            "analysis": "Detailed analysis in Vietnamese covering: pace of speech, pauses and hesitations, coherence and cohesion, use of linking devices, ability to develop topics. If answer is off-topic, note this but still evaluate fluency aspects. Be specific about what was observed."
        },
        "lexical_resource": {
            "score": float,
            "analysis": "Detailed analysis in Vietnamese covering: vocabulary range, use of less common/idiomatic expressions, collocation, word choice appropriacy, any lexical errors or repetitions. Evaluate based on actual words used in the transcript. Provide specific examples."
        },
        "grammatical_range": {
            "score": float,
            "analysis": "Detailed analysis in Vietnamese covering: variety of sentence structures (simple, compound, complex), tense usage and accuracy, grammatical errors and their frequency/severity. Evaluate based on actual grammar in the transcript. Highlight specific structures used or missing."
        },
        "pronunciation": {
            "score": float,
            "analysis": "Analysis in Vietnamese based on transcript: assess indicators of word stress patterns, sentence rhythm, clarity of expression. Note: actual pronunciation cannot be fully assessed from transcript alone, but infer from sentence structure and clarity. Focus on indicators of speech clarity and naturalness evident in the text."
        }
    },
    "examiner_feedback": "A natural, 3-4 sentence summary in Vietnamese written like a real IELTS examiner: What was good, what to improve, and how to reach the next band level. If answer was off-topic, mention this but focus on language skills evaluated. Be encouraging but honest.",
    "strengths": ["specific strength 1 in Vietnamese", "specific strength 2 in Vietnamese"],
    "areas_for_improvement": ["specific area 1 with actionable advice in Vietnamese", "specific area 2 with actionable advice in Vietnamese"]
}

EVALUATION GUIDELINES:

1. **Scoring Rules**:
   - Use 0.5 increments only (e.g., 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0)
   - ALL scores must be > 0.0 if transcript has meaningful content (even if off-topic)
   - Only use 0.0 if: empty transcript, <5 words, or completely incomprehensible gibberish
   - Minimum score for meaningful English: 3.0-4.0 (even if very basic)

2. **Evidence-Based Evaluation**:
   - Always cite specific examples from the transcript
   - Count actual errors, don't guess
   - Identify specific vocabulary words, sentence structures, linking devices
   - Base scores on observable language features, not assumptions

3. **Topic Relevance Handling**:
   - If off-topic: Analyze WHY (misunderstanding question? avoiding topic? confused?)
   - Reduce Fluency & Coherence appropriately (topic development = low, but evaluate other aspects)
   - STILL evaluate Grammar, Vocabulary, Pronunciation based on actual language used
   - Provide feedback that addresses both topic relevance AND language skills

4. **Part-Specific Considerations**:
   - Part 1: Expect short responses, personal information, basic vocabulary
   - Part 2: Expect longer monologue (1-2 minutes), developed ideas, more complex structures
   - Part 3: Expect abstract discussion, opinions, complex arguments, sophisticated vocabulary

5. **Fair Assessment**:
   - Don't penalize for accent (only clarity matters)
   - Don't over-penalize for minor errors that don't impede communication
   - Recognize effort and attempt, even if imperfect
   - Be encouraging but honest about areas needing improvement

6. **Output Requirements**:
   - All detailed feedback and analysis must be in Vietnamese
   - Examiner feedback should sound natural and professional
   - Provide actionable, specific advice
   - Overall band = average of 4 criteria, rounded to nearest 0.5

7. **Quality Assurance**:
   - Review each score to ensure it matches the detailed analysis
   - Ensure scores are consistent with band descriptors
   - Double-check that off-topic answers still receive fair language evaluation
   - Verify that all examples cited actually exist in the transcript`

	// Prepare request payload
	payload := map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]interface{}{
			{
				"role":    "system",
				"content": systemPrompt,
			},
			{
				"role":    "user",
				"content": evaluationPrompt,
			},
		},
		"temperature":     0.3,
		"response_format": map[string]string{"type": "json_object"},
	}

	eval := &models.OpenAISpeakingEvaluation{}
	_, err := c.callChatAPI(payload, eval)
	if err != nil {
		return nil, err
	}
	return eval, nil
}

// callChatAPI is a helper to call OpenAI Chat API
func (c *OpenAIClient) callChatAPI(payload interface{}, result interface{}) (interface{}, error) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", c.BaseURL+"/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenAI API error: %s - %s", resp.Status, string(bodyBytes))
	}

	var response struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no choices in response")
	}

	// Parse JSON content to result type
	contentBytes := []byte(response.Choices[0].Message.Content)
	if err := json.Unmarshal(contentBytes, result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal evaluation: %w", err)
	}

	return result, nil
}
