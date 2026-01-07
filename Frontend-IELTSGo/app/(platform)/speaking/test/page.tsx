/**
 * Speaking Exercise Page - Complete Flow
 * 
 * Flow:
 * 1. User records audio with AudioRecorder
 * 2. Audio uploads to MinIO (FREE storage)
 * 3. Submit to Exercise Service
 * 4. AI Service evaluates (transcribe → score)
 * 5. Show results
 */

'use client';

import { useState } from 'react';
import { AudioRecorder } from '@/components/speaking/AudioRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SpeakingExercisePage() {
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Mock user data (replace with real auth)
  const userId = 'a75d491e-3d65-4437-baeb-21b6e7e2dee3'; // bi@gmail.com
  const token = 'your-jwt-token'; // Get from auth context

  // TODO: Add proper auth context and admin check
  // Prevent admins from starting exercises
  const handleStartExercise = async () => {
    if (user?.role === 'admin') {
      alert('Admins cannot start exercises. Use a student or instructor account.')
      return
    }
    try {
      const response = await fetch('/api/v1/exercises/dd3abb5b-e1ae-482e-b798-1ee686ce7ecd/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSubmissionId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to start exercise:', error);
    }
  };

  /**
   * Step 2: Submit audio after recording
   */
  const handleAudioReady = async (audioUrl: string) => {
    if (!submissionId) {
      alert('Please start exercise first');
      return;
    }

    setAudioUrl(audioUrl);
    setIsSubmitting(true);

    try {
      // Submit to Exercise Service
      const response = await fetch(`/api/v1/submissions/${submissionId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          speaking_data: {
            audio_url: audioUrl,
            audio_duration_seconds: 120, // Replace with actual duration
            speaking_part_number: 2,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Wait for AI evaluation
        await checkResult();
      }
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Step 3: Poll for evaluation result
   */
  const checkResult = async () => {
    if (!submissionId) return;

    const maxAttempts = 30; // 30 seconds
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/v1/submissions/${submissionId}/result`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        
        if (data.data.submission.evaluation_status === 'completed') {
          clearInterval(pollInterval);
          setResult(data);
        } else if (data.data.submission.evaluation_status === 'failed') {
          clearInterval(pollInterval);
          alert('Evaluation failed. Please try again.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          alert('Evaluation timed out. Please check later.');
        }
      } catch (error) {
        console.error('Failed to check result:', error);
      }
    }, 1000);
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <h1 className="text-3xl font-bold">IELTS Speaking Part 2</h1>
      
      {/* Exercise Prompt */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📝 Topic</h2>
        <p className="text-lg mb-4">
          Describe someone who has had an important influence on your life.
        </p>
        <p className="text-sm text-muted-foreground">
          You should say:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
          <li>Who this person is</li>
          <li>How you know this person</li>
          <li>What influence they have had on you</li>
          <li>And explain why this influence has been important</li>
        </ul>
      </Card>

      {/* Start Exercise Button */}
      {!submissionId && (
        <Button onClick={handleStartExercise} size="lg" className="w-full">
          Start Exercise
        </Button>
      )}

      {/* Audio Recorder */}
      {submissionId && !result && (
        <AudioRecorder 
          onAudioReady={handleAudioReady}
          maxDuration={180}
          userId={userId}
          token={token}
        />
      )}

      {/* Submission Status */}
      {isSubmitting && (
        <Card className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Evaluating your response...</p>
          <p className="text-sm text-muted-foreground">This may take 10-15 seconds</p>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">🎉 Results</h2>
          
          {/* Band Score */}
          <div className="text-center p-6 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Overall Band Score</p>
            <p className="text-5xl font-bold text-primary">
              {result.data.submission.band_score || 'N/A'}
            </p>
          </div>

          {/* Criteria Scores */}
          {result.data.submission.detailed_scores && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Fluency & Coherence</p>
                <p className="text-2xl font-bold">{result.data.submission.detailed_scores.fluency}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Lexical Resource</p>
                <p className="text-2xl font-bold">{result.data.submission.detailed_scores.lexical_resource}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Grammar</p>
                <p className="text-2xl font-bold">{result.data.submission.detailed_scores.grammar}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Pronunciation</p>
                <p className="text-2xl font-bold">{result.data.submission.detailed_scores.pronunciation}</p>
              </div>
            </div>
          )}

          {/* Feedback */}
          {result.data.submission.feedback && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">📋 Examiner Feedback</h3>
              <p className="text-sm whitespace-pre-wrap">{result.data.submission.feedback}</p>
            </div>
          )}

          {/* Try Again */}
          <Button 
            onClick={() => {
              setSubmissionId(null);
              setResult(null);
              setAudioUrl(null);
            }}
            className="w-full"
            variant="outline"
          >
            Try Another Exercise
          </Button>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950">
        <p className="text-sm">
          💡 <strong>100% FREE Technology Stack:</strong><br/>
          ✅ MediaRecorder API (browser built-in)<br/>
          ✅ MinIO Storage (self-hosted, no cloud costs)<br/>
          ✅ OpenAI Whisper (transcription)<br/>
          ✅ OpenAI GPT-4 (evaluation)
        </p>
      </Card>
    </div>
  );
}
