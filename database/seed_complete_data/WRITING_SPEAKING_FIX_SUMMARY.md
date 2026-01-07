# Writing/Speaking Exercise Display Fix

## 🐛 Vấn đề ban đầu

Writing/Speaking exercises hiển thị **"0/4 questions"** và **percentage 0%** - điều này không hợp lý vì:
- Writing exercises không có multiple choice questions
- Speaking exercises không có multiple choice questions
- Chỉ có Reading/Listening mới có questions cần trả lời

## 🔍 Nguyên nhân

1. **Database sai**: Writing/Speaking exercises có `total_questions = 4` thay vì `0`
2. **Frontend hiển thị không phù hợp**: Hiển thị question count cho tất cả loại exercises

## ✅ Giải pháp đã áp dụng

### 1. Database Fixes

**File mới**: `database/seed_complete_data/99_fix_writing_speaking_questions.sql`

```sql
-- Update exercises table
UPDATE exercises 
SET 
    total_questions = 0,
    total_sections = 0
WHERE skill_type IN ('writing', 'speaking');

-- Update existing submissions
UPDATE user_exercise_attempts 
SET total_questions = 0
WHERE exercise_id IN (
    SELECT id FROM exercises WHERE skill_type IN ('writing', 'speaking')
);
```

**Chạy ngay**:
```bash
docker exec ielts_postgres psql -U ielts_admin -d exercise_db -c "UPDATE exercises SET total_questions = 0, total_sections = 0 WHERE skill_type IN ('writing', 'speaking');"
docker exec ielts_postgres psql -U ielts_admin -d exercise_db -c "UPDATE user_exercise_attempts SET total_questions = 0 WHERE exercise_id IN (SELECT id FROM exercises WHERE skill_type IN ('writing', 'speaking'));"
```

### 2. Frontend Fixes

#### A. Exercise Submission Card (`components/exercises/exercise-submission-card.tsx`)

**Trước**:
```tsx
{submission.questions_answered || 0}/{submission.total_questions || 0} {t('questions')}
```

**Sau**:
```tsx
{/* Only show questions for Reading/Listening */}
{(skillType.toLowerCase() === 'reading' || skillType.toLowerCase() === 'listening') && (
  <div className="flex items-center gap-1.5">
    <Target className="h-4 w-4 text-blue-600" />
    <span>{submission.questions_answered}/{submission.total_questions} {t('questions')}</span>
  </div>
)}

{/* Show word count for Writing */}
{skillType.toLowerCase() === 'writing' && submission.word_count && (
  <div className="flex items-center gap-1.5">
    <Target className="h-4 w-4 text-orange-600" />
    <span>{submission.word_count} {t('words_written')}</span>
  </div>
)}

{/* Show duration for Speaking */}
{skillType.toLowerCase() === 'speaking' && submission.audio_duration_seconds && (
  <div className="flex items-center gap-1.5">
    <Target className="h-4 w-4 text-purple-600" />
    <span>{Math.floor(submission.audio_duration_seconds / 60)}:{String(submission.audio_duration_seconds % 60).padStart(2, '0')}</span>
  </div>
)}
```

#### B. Exercise History Page (`app/exercises/history/page.tsx`)

**Thêm hiển thị**:
- Word count cho Writing exercises
- Audio duration cho Speaking exercises
- Chỉ hiển thị "X/Y questions" cho Reading/Listening

#### C. Exercise Detail Page (`app/exercises/[exerciseId]/page.tsx`)

**Trước**:
```tsx
<p>• Number of questions: {totalQuestions} questions</p>
```

**Sau**:
```tsx
{/* Only show question count for Reading/Listening */}
{(exercise.skill_type?.toLowerCase() === 'reading' || exercise.skill_type?.toLowerCase() === 'listening') && (
  <p>• Number of questions: {totalQuestions} questions</p>
)}

{/* Show essay-based message for Writing/Speaking */}
{(exercise.skill_type?.toLowerCase() === 'writing' || exercise.skill_type?.toLowerCase() === 'speaking') && (
  <p>• Essay-based exercise (no multiple choice questions)</p>
)}
```

#### D. Exercise Result Page (`app/exercises/[exerciseId]/result/[submissionId]/page.tsx`)

**Trước**:
```tsx
<p>{t('you_scored')} {correct}/{total} {t('questions_correct')}</p>

<div className="grid grid-cols-4">
  <div>Correct: {correct}</div>
  <div>Incorrect: {incorrect}</div>
  <div>Skipped: {skipped}</div>
  <div>Time: {time}</div>
</div>
```

**Sau**:
```tsx
{/* Different messages for different skills */}
{exercise.skill_type === 'writing' ? (
  <p>{submission.word_count} words written</p>
) : exercise.skill_type === 'speaking' ? (
  <p>Duration: {audio_duration}</p>
) : (
  <p>{correct}/{total} questions correct</p>
)}

{/* Different stats display */}
{exercise.skill_type === 'writing' ? (
  <div className="grid grid-cols-4">
    <div>Word count: {word_count}</div>
    <div>Status: {evaluation_status}</div>
    <div>Time: {time}</div>
    <div>Task: {task_type}</div>
  </div>
) : exercise.skill_type === 'speaking' ? (
  <div className="grid grid-cols-4">
    <div>Duration: {duration}</div>
    <div>Status: {evaluation_status}</div>
    <div>Time: {time}</div>
    <div>Part: {speaking_part}</div>
  </div>
) : (
  // Original Reading/Listening stats
)}
```

### 3. Translation Keys

**Thêm vào `messages/en.json` và `messages/vi.json`**:

```json
{
  "essay_based_exercise": "Essay-based exercise (no multiple choice questions)",
  "essay_submitted": "Essay submitted",
  "word_count": "Word count",
  "words_written": "words written",
  "audio_submitted": "Audio submitted",
  "speaking_duration": "Duration",
  "transcript_available": "Transcript available",
  "evaluation_status": "Evaluation Status",
  "task_type": "Task Type",
  "speaking_part": "Speaking Part"
}
```

## 🎯 Kết quả

### Trước fix:
- ❌ "0/4 questions" cho Writing exercises
- ❌ "0.0%" percentage
- ❌ Confusing UI cho user

### Sau fix:
- ✅ "250 words written" cho Writing
- ✅ "2:30 duration" cho Speaking
- ✅ Chỉ hiển thị questions cho Reading/Listening
- ✅ Rõ ràng và dễ hiểu

## 📋 Testing Checklist

- [ ] Writing exercise card hiển thị word count
- [ ] Speaking exercise card hiển thị duration
- [ ] Reading exercise vẫn hiển thị questions correctly
- [ ] Listening exercise vẫn hiển thị questions correctly
- [ ] Exercise history page hiển thị stats phù hợp
- [ ] Exercise result page hiển thị đúng thông tin
- [ ] Database đã được update
- [ ] Translations hoạt động cho cả EN và VI

## 🚀 Deployment

1. Pull latest code
2. Run database fix:
   ```bash
   docker exec ielts_postgres psql -U ielts_admin -d exercise_db -f /path/to/99_fix_writing_speaking_questions.sql
   ```
3. Restart frontend service
4. Verify fixes on all pages

## 📝 Notes

- Script fix đã được thêm vào `clean-and-seed.sh` - sẽ tự động chạy khi seed lại database
- Submission type đã có sẵn `word_count` và `audio_duration_seconds` fields
- Không cần thay đổi backend API
