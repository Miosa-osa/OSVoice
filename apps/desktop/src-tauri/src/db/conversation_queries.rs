use sqlx::{sqlite::SqliteRow, Row, SqlitePool};

use crate::domain::{Conversation, Message};

fn row_to_conversation(row: SqliteRow) -> Result<Conversation, sqlx::Error> {
    Ok(Conversation {
        id: row.get::<String, _>("id"),
        title: row.get::<String, _>("title"),
        created_at: row.get::<String, _>("created_at"),
        updated_at: row.get::<String, _>("updated_at"),
    })
}

fn row_to_message(row: SqliteRow) -> Result<Message, sqlx::Error> {
    Ok(Message {
        id: row.get::<String, _>("id"),
        conversation_id: row.get::<String, _>("conversation_id"),
        role: row.get::<String, _>("role"),
        content: row.get::<String, _>("content"),
        model: row.try_get::<Option<String>, _>("model")?,
        tokens_used: row.try_get::<Option<i64>, _>("tokens_used")?,
        created_at: row.get::<String, _>("created_at"),
    })
}

pub async fn insert_conversation(
    pool: SqlitePool,
    conversation: &Conversation,
) -> Result<Conversation, sqlx::Error> {
    sqlx::query(
        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
    )
    .bind(&conversation.id)
    .bind(&conversation.title)
    .bind(&conversation.created_at)
    .bind(&conversation.updated_at)
    .execute(&pool)
    .await?;

    Ok(conversation.clone())
}

pub async fn fetch_conversations(
    pool: SqlitePool,
    limit: u32,
    offset: u32,
) -> Result<Vec<Conversation>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT ?1 OFFSET ?2",
    )
    .bind(limit as i64)
    .bind(offset as i64)
    .fetch_all(&pool)
    .await?;

    let mut conversations = Vec::with_capacity(rows.len());
    for row in rows {
        conversations.push(row_to_conversation(row)?);
    }

    Ok(conversations)
}

pub async fn update_conversation(
    pool: SqlitePool,
    conversation: &Conversation,
) -> Result<Conversation, sqlx::Error> {
    sqlx::query("UPDATE conversations SET title = ?2, updated_at = ?3 WHERE id = ?1")
        .bind(&conversation.id)
        .bind(&conversation.title)
        .bind(&conversation.updated_at)
        .execute(&pool)
        .await?;

    Ok(conversation.clone())
}

pub async fn delete_conversation(pool: SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM conversations WHERE id = ?1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(())
}

pub async fn insert_message(pool: SqlitePool, message: &Message) -> Result<Message, sqlx::Error> {
    sqlx::query(
        "INSERT INTO messages (id, conversation_id, role, content, model, tokens_used, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    )
    .bind(&message.id)
    .bind(&message.conversation_id)
    .bind(&message.role)
    .bind(&message.content)
    .bind(message.model.as_deref())
    .bind(message.tokens_used)
    .bind(&message.created_at)
    .execute(&pool)
    .await?;

    Ok(message.clone())
}

pub async fn fetch_messages(
    pool: SqlitePool,
    conversation_id: &str,
) -> Result<Vec<Message>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT id, conversation_id, role, content, model, tokens_used, created_at FROM messages WHERE conversation_id = ?1 ORDER BY created_at ASC",
    )
    .bind(conversation_id)
    .fetch_all(&pool)
    .await?;

    let mut messages = Vec::with_capacity(rows.len());
    for row in rows {
        messages.push(row_to_message(row)?);
    }

    Ok(messages)
}

pub async fn delete_messages_for_conversation(
    pool: SqlitePool,
    conversation_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM messages WHERE conversation_id = ?1")
        .bind(conversation_id)
        .execute(&pool)
        .await?;

    Ok(())
}
