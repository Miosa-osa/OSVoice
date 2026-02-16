use sqlx::{sqlite::SqliteRow, Row, SqlitePool};

use crate::domain::{Meeting, MeetingSegment};

fn row_to_meeting(row: SqliteRow) -> Result<Meeting, sqlx::Error> {
    Ok(Meeting {
        id: row.get::<String, _>("id"),
        title: row.get::<String, _>("title"),
        app_source: row.try_get::<Option<String>, _>("app_source")?,
        started_at: row.get::<String, _>("started_at"),
        ended_at: row.try_get::<Option<String>, _>("ended_at")?,
        duration_ms: row.try_get::<Option<i64>, _>("duration_ms")?,
        status: row.get::<String, _>("status"),
        audio_path: row.try_get::<Option<String>, _>("audio_path")?,
        summary: row.try_get::<Option<String>, _>("summary")?,
        action_items: row.try_get::<Option<String>, _>("action_items")?,
        created_at: row.get::<String, _>("created_at"),
        updated_at: row.get::<String, _>("updated_at"),
    })
}

fn row_to_segment(row: SqliteRow) -> Result<MeetingSegment, sqlx::Error> {
    Ok(MeetingSegment {
        id: row.get::<String, _>("id"),
        meeting_id: row.get::<String, _>("meeting_id"),
        speaker_id: row.try_get::<Option<String>, _>("speaker_id")?,
        speaker_name: row.try_get::<Option<String>, _>("speaker_name")?,
        text: row.get::<String, _>("text"),
        start_ms: row.get::<i64, _>("start_ms"),
        end_ms: row.get::<i64, _>("end_ms"),
        created_at: row.get::<String, _>("created_at"),
    })
}

pub async fn insert_meeting(
    pool: SqlitePool,
    meeting: &Meeting,
) -> Result<Meeting, sqlx::Error> {
    sqlx::query(
        "INSERT INTO meetings (id, title, app_source, started_at, ended_at, duration_ms, status, audio_path, summary, action_items, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
    )
    .bind(&meeting.id)
    .bind(&meeting.title)
    .bind(&meeting.app_source)
    .bind(&meeting.started_at)
    .bind(&meeting.ended_at)
    .bind(meeting.duration_ms)
    .bind(&meeting.status)
    .bind(&meeting.audio_path)
    .bind(&meeting.summary)
    .bind(&meeting.action_items)
    .bind(&meeting.created_at)
    .bind(&meeting.updated_at)
    .execute(&pool)
    .await?;

    Ok(meeting.clone())
}

const MAX_MEETING_LIMIT: u32 = 200;

pub async fn fetch_meetings(
    pool: SqlitePool,
    limit: u32,
    offset: u32,
) -> Result<Vec<Meeting>, sqlx::Error> {
    let capped_limit = limit.min(MAX_MEETING_LIMIT);
    let rows = sqlx::query(
        "SELECT id, title, app_source, started_at, ended_at, duration_ms, status, audio_path, summary, action_items, created_at, updated_at
         FROM meetings
         ORDER BY started_at DESC
         LIMIT ?1 OFFSET ?2",
    )
    .bind(capped_limit as i64)
    .bind(offset as i64)
    .fetch_all(&pool)
    .await?;

    let mut meetings = Vec::with_capacity(rows.len());
    for row in rows {
        meetings.push(row_to_meeting(row)?);
    }

    Ok(meetings)
}

pub async fn update_meeting(
    pool: SqlitePool,
    meeting: &Meeting,
) -> Result<Meeting, sqlx::Error> {
    sqlx::query(
        "UPDATE meetings SET title = ?2, ended_at = ?3, duration_ms = ?4, status = ?5, audio_path = ?6, summary = ?7, action_items = ?8, updated_at = ?9
         WHERE id = ?1",
    )
    .bind(&meeting.id)
    .bind(&meeting.title)
    .bind(&meeting.ended_at)
    .bind(meeting.duration_ms)
    .bind(&meeting.status)
    .bind(&meeting.audio_path)
    .bind(&meeting.summary)
    .bind(&meeting.action_items)
    .bind(&meeting.updated_at)
    .execute(&pool)
    .await?;

    Ok(meeting.clone())
}

pub async fn delete_meeting(pool: SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM meetings WHERE id = ?1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(())
}

pub async fn fetch_meeting_segments(
    pool: SqlitePool,
    meeting_id: &str,
) -> Result<Vec<MeetingSegment>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, meeting_id, speaker_id, speaker_name, text, start_ms, end_ms, created_at
         FROM meeting_segments
         WHERE meeting_id = ?1
         ORDER BY start_ms ASC",
    )
    .bind(meeting_id)
    .fetch_all(&pool)
    .await?;

    let mut segments = Vec::with_capacity(rows.len());
    for row in rows {
        segments.push(row_to_segment(row)?);
    }

    Ok(segments)
}

pub async fn insert_meeting_segments(
    pool: SqlitePool,
    segments: &[MeetingSegment],
) -> Result<Vec<MeetingSegment>, sqlx::Error> {
    let mut tx = pool.begin().await?;

    for segment in segments {
        sqlx::query(
            "INSERT INTO meeting_segments (id, meeting_id, speaker_id, speaker_name, text, start_ms, end_ms, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        )
        .bind(&segment.id)
        .bind(&segment.meeting_id)
        .bind(&segment.speaker_id)
        .bind(&segment.speaker_name)
        .bind(&segment.text)
        .bind(segment.start_ms)
        .bind(segment.end_ms)
        .bind(&segment.created_at)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(segments.to_vec())
}

pub async fn update_meeting_segment_speaker(
    pool: SqlitePool,
    meeting_id: &str,
    speaker_id: &str,
    new_name: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE meeting_segments SET speaker_name = ?3 WHERE meeting_id = ?1 AND speaker_id = ?2",
    )
    .bind(meeting_id)
    .bind(speaker_id)
    .bind(new_name)
    .execute(&pool)
    .await?;

    Ok(())
}
