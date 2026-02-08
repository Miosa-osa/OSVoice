import {
  AddRounded,
  ChatBubbleOutlineRounded,
  DeleteOutlineRounded,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import {
  deleteConversation,
  setActiveConversation,
} from "../../actions/chat.actions";
import { useAppStore } from "../../store";

type ChatConversationListProps = {
  onNewConversation: () => void;
};

export const ChatConversationList = ({
  onNewConversation,
}: ChatConversationListProps) => {
  const conversationIds = useAppStore((state) => state.chat.conversationIds);
  const activeConversationId = useAppStore(
    (state) => state.chat.activeConversationId,
  );

  const handleSelect = useCallback((id: string) => {
    void setActiveConversation(id);
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    void deleteConversation(id);
  }, []);

  return (
    <Box
      sx={(theme) => ({
        width: 220,
        minWidth: 220,
        borderRight: `1px solid ${theme.vars?.palette.level2}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      })}
    >
      <Box
        sx={{
          px: 1.5,
          pt: 1.5,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="labelSmall" color="text.secondary">
          <FormattedMessage defaultMessage="Conversations" />
        </Typography>
        <IconButton size="small" onClick={onNewConversation}>
          <AddRounded sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1 }}>
        <List disablePadding dense>
          {conversationIds.map((id) => (
            <ConversationItem
              key={id}
              id={id}
              isActive={id === activeConversationId}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))}
        </List>
        {conversationIds.length === 0 && (
          <Box sx={{ px: 1, py: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12, textAlign: "center" }}
            >
              <FormattedMessage defaultMessage="No conversations yet" />
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

type ConversationItemProps = {
  id: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
};

const ConversationItem = ({
  id,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) => {
  const conversation = useAppStore((state) => state.conversationById[id]);

  if (!conversation) return null;

  const title = conversation.title || "New conversation";

  return (
    <ListItemButton
      selected={isActive}
      onClick={() => onSelect(id)}
      sx={(theme) => ({
        borderRadius: 2,
        py: 0.75,
        px: 1,
        mb: 0.25,
        gap: 1,
        "&.Mui-selected": {
          backgroundColor: theme.vars?.palette.level2,
        },
        "& .delete-btn": { opacity: 0 },
        "&:hover .delete-btn": { opacity: 1 },
      })}
    >
      <ChatBubbleOutlineRounded
        sx={{ fontSize: 14, opacity: 0.5, flexShrink: 0 }}
      />
      <ListItemText
        primary={title}
        primaryTypographyProps={{
          noWrap: true,
          sx: { fontSize: 13 },
        }}
      />
      <IconButton
        className="delete-btn"
        size="small"
        onClick={(e) => onDelete(e, id)}
        sx={{ p: 0.25 }}
      >
        <DeleteOutlineRounded sx={{ fontSize: 14 }} />
      </IconButton>
    </ListItemButton>
  );
};
