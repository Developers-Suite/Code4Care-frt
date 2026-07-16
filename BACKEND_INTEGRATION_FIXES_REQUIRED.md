# Backend Integration Fixes Required

**Date:** May 10, 2026  
**Status:** Critical - Blocking frontend analytics and chat history features  
**Tested Against:** Production API (api.lydiacallcenter.org)

---

## Executive Summary

Three critical gaps prevent Chat4Care frontend from functioning fully:

1. **Chat messages are not persisted** to session history (blocking chat replay, analytics)
2. **Safety metrics metadata is not aggregated** into analytics (blocking admin dashboard safety metrics)
3. **Crisis intervention counts missing** from analytics responses

This document specifies exact field names, aliases, example payloads, and test cases for backend implementation.

---

## Priority 1: Persist Chat Messages to Session History

### Issue
POST `/v1/chat` accepts messages and returns valid bot responses, but GET `/v1/chat/session/{session_id}` returns empty message history.

### Test Case (FAILED)

**Request:**
```bash
curl -X POST "https://api.lydiacallcenter.org/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "msg-test-1778396886",
    "message": "I have been having thoughts about self-harm lately and need help",
    "language": "en"
  }'
```

**Response (Successful):**
```json
{
  "session_id": "741ba223-af73-415a-a480-ebc1484c5446",
  "answer": "It sounds like you may be going through something...",
  "citations": [...],
  "safety_flags": ["crisis_detected", "crisis_resources_injected"],
  "language_detected": "en",
  "response_time_ms": 1940.7
}
```

**Then retrieving session history:**
```bash
curl "https://api.lydiacallcenter.org/v1/chat/session/msg-test-1778396886"
```

**Response (BROKEN - messages missing):**
```json
{
  "session_id": "msg-test-1778396886",
  "user_id": null,
  "created_at": "2026-05-10T07:08:10.626874Z",
  "last_message_at": null,
  "duration_seconds": null,
  "language": null,
  "total_messages": 0,
  "messages": [],
  "topics_discussed": [],
  "safety_summary": {
    "flags_triggered": 0,
    "escalations": 0,
    "crisis_interventions": 0
  }
}
```

### Required Fix

**When POST `/v1/chat` completes successfully:**

1. Extract the user's input message and create a message record:
   ```json
   {
     "id": "<generate UUID>",
     "role": "user",
     "content": "<user message from request>",
     "timestamp": "<ISO 8601 timestamp>",
     "language": "<language from request>"
   }
   ```

2. Extract the bot response and create a message record:
   ```json
   {
     "id": "<generate UUID>",
     "role": "bot",
     "content": "<bot answer>",
     "timestamp": "<ISO 8601 timestamp>",
     "language": "<language_detected from response>",
     "citations": "<array from response>",
     "safety_flags": "<array from response>"
   }
   ```

3. Persist both messages to the session's message history in the database.

4. Update session metadata:
   - `last_message_at`: set to current timestamp
   - `total_messages`: increment by 2
   - `language`: set to language_detected if not already set
   - `duration_seconds`: calculate from created_at to last_message_at

### Expected Response After Fix

```bash
curl "https://api.lydiacallcenter.org/v1/chat/session/msg-test-1778396886"
```

Should return:
```json
{
  "session_id": "msg-test-1778396886",
  "user_id": null,
  "created_at": "2026-05-10T07:08:10.626874Z",
  "last_message_at": "2026-05-10T07:08:12.567489Z",
  "duration_seconds": 2,
  "language": "en",
  "total_messages": 2,
  "messages": [
    {
      "id": "user-msg-001",
      "role": "user",
      "content": "I have been having thoughts about self-harm lately and need help",
      "timestamp": "2026-05-10T07:08:10.800000Z",
      "language": "en"
    },
    {
      "id": "bot-msg-001",
      "role": "bot",
      "content": "It sounds like you may be going through something...",
      "timestamp": "2026-05-10T07:08:12.567489Z",
      "language": "en",
      "citations": [
        {
          "title": "Psychiatric-Mental Health Nursing",
          "source_url": "",
          "score": 0.603
        }
      ],
      "safety_flags": ["crisis_detected", "crisis_resources_injected"]
    }
  ],
  "topics_discussed": [],
  "safety_summary": {
    "flags_triggered": 2,
    "escalations": 0,
    "crisis_interventions": 0
  }
}
```

---

## Priority 2: Aggregate Safety Metadata into Analytics

### Issue
Frontend sends `metadata` with chat events containing safety summary fields, but `/analytics/safety` and `/v1/analytics/summary` return empty or missing these fields.

### What Frontend Sends

**POST `/v1/chat/event` Request:**
```json
{
  "session_id": "test-session-123",
  "event_type": "bot_response",
  "metadata": {
    "harm_count": 1,
    "self_harm_mentions": 1,
    "suicidal_ideation_mentions": 0,
    "risks_escalated_to_human": 0,
    "response_time_ms": 1940.7,
    "language_detected": "en",
    "citations_count": 4
  }
}
```

### Required Fix

**Aggregate metadata fields into analytics by period:**

1. When `/v1/chat/event` is received, extract and store these fields:
   - `harm_count` → count of total safety flags
   - `self_harm_mentions` → count of self-harm related flags
   - `suicidal_ideation_mentions` → count of suicidal ideation flags
   - `risks_escalated_to_human` → count of escalation flags

2. Update analytics aggregation for `/v1/analytics/summary` to include:

   ```json
   "safetyMetrics": {
     "crisisInterventionsTriggered": 11,
     "panicExitsTotal": 11,
     "self_harm_mentions": <sum from chat events>,
     "self_harm_mentions_detected": <same, alias>,
     "selfHarmMentions": <same, alias>,
     "suicidal_ideation_mentions": <sum from chat events>,
     "suicidalIdeationMentions": <same, alias>,
     "suicidal_ideation": <same, alias>,
     "risks_escalated_to_human": <sum from chat events>,
     "risksEscalatedToHuman": <same, alias>,
     "total_escalated": <same, alias>
   }
   ```

3. Update `/analytics/safety` to return aggregated counts:

   ```json
   {
     "period": "week",
     "incidents": {
       "self_harm_mentions": <number>,
       "suicidal_ideation_mentions": <number>,
       "risks_escalated_to_human": <number>,
       "harm_count_total": <number>
     },
     "severity_distribution": {
       "low": <count>,
       "medium": <count>,
       "high": <count>,
       "critical": <count>
     },
     "escalations": {
       "to_human_consultant": <count>,
       "to_external_resources": <count>,
       "total_escalated": <count>
     },
     "trends": {...},
     "demographics": {...}
   }
   ```

### Field Aliases (Support Both camelCase and snake_case)

| Canonical Field | Aliases (Accept All) |
|-----------------|----------------------|
| `self_harm_mentions` | `self_harm_mentions`, `selfHarmMentions`, `self_harm_mentions_detected` |
| `suicidal_ideation_mentions` | `suicidal_ideation_mentions`, `suicidalIdeationMentions`, `suicidal_ideation` |
| `risks_escalated_to_human` | `risks_escalated_to_human`, `risksEscalatedToHuman`, `total_escalated` |
| `crisis_interventions` | `crisis_interventions`, `crisisInterventions`, `crisisInterventionsTriggered`, `crisis_interventions_triggered` |

### Expected Response After Fix

```bash
curl "https://api.lydiacallcenter.org/v1/analytics/summary?period=week" \
  -H "accept: application/json"
```

Should return (in `safetyMetrics`):
```json
{
  "period": "week",
  "safetyMetrics": {
    "crisisInterventionsTriggered": 11,
    "panicExitsTotal": 11,
    "self_harm_mentions": 3,
    "suicidal_ideation_mentions": 2,
    "risks_escalated_to_human": 1,
    "abuse_mentions": 0,
    "concerned_users_followed_up": 0
  }
}
```

---

## Priority 3: Include Crisis Intervention Counts

### Issue
`/analytics/safety` endpoint is implemented but returns empty objects.

### Test Case (FAILED)

```bash
curl "https://api.lydiacallcenter.org/analytics/safety?period=week" \
  -H "accept: application/json"
```

**Current Response (Empty):**
```json
{
  "period": "week",
  "incidents": {},
  "severity_distribution": {},
  "escalations": {},
  "trends": {},
  "demographics": {}
}
```

### Required Fix

Populate `/analytics/safety` with aggregated crisis data:

```json
{
  "period": "week",
  "incidents": {
    "total": 42,
    "self_harm_mentions": 3,
    "suicidal_ideation_mentions": 2,
    "abuse_mentions": 1,
    "panic_button_presses": 11,
    "crisis_interventions": 5
  },
  "severity_distribution": {
    "low": 10,
    "medium": 15,
    "high": 12,
    "critical": 5
  },
  "escalations": {
    "to_human_consultant": 8,
    "to_external_resources": 2,
    "follow_up_pending": 3,
    "total_escalated": 13
  },
  "trends": {
    "incidents_increasing": true,
    "change_vs_last_period": 15,
    "peak_time": "18:00-20:00"
  },
  "demographics": {
    "15-19": 12,
    "20-24": 18,
    "25+": 12
  }
}
```

---

## Implementation Summary

| Endpoint | Change | Impact |
|----------|--------|--------|
| `POST /v1/chat` | Persist user + bot messages to session | Message history, admin reporting |
| `GET /v1/chat/session/{session_id}` | Return persisted messages | Chat replay, user history |
| `POST /v1/chat/event` | Extract & aggregate metadata fields | Analytics aggregation |
| `GET /v1/analytics/summary` | Include safety metadata in response | Admin dashboard safety metrics |
| `GET /analytics/safety` | Return aggregated crisis counts | Admin dashboard safety detail view |

---

## Testing Checklist

After implementation, verify:

- [ ] POST `/v1/chat` with self-harm message → safety_flags contains `crisis_detected`
- [ ] GET `/v1/chat/session/{session_id}` → `messages` array has 2+ items (user + bot)
- [ ] POST `/v1/chat/event` with metadata → receives 200 OK
- [ ] GET `/v1/analytics/summary` → `safetyMetrics` includes `self_harm_mentions`, `suicidal_ideation_mentions`, `risks_escalated_to_human`
- [ ] GET `/analytics/safety` → `incidents` object populated with counts > 0

---

## Frontend Status

**Frontend is ready** — all necessary code is in place to:
- Send metadata with chat events (via `ChatInterface.tsx`)
- Read and normalize analytics responses (via `RealAnalyticsService.ts`)
- Display safety metrics in admin dashboard (via `AdminReports.tsx`, `AdminSafetyManagement.tsx`)

Frontend is **blocked** on backend implementing these three fixes.
