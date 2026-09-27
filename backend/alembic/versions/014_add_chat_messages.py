"""Add chat_messages table for user copilot history

Revision ID: 014_add_chat_messages
Revises: 013_recurring_bills_notifs
Create Date: 2026-09-27 11:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '014_add_chat_messages'
down_revision: Union[str, None] = '013_recurring_bills_notifs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='user'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('intent', sa.String(length=50), nullable=True),
        sa.Column('metrics_snapshot', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("role IN ('user', 'assistant', 'system')", name='ck_chat_messages_role'),
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'], unique=False)
    op.create_index('ix_chat_messages_user_id', 'chat_messages', ['user_id'], unique=False)
    op.create_index('ix_chat_messages_role', 'chat_messages', ['role'], unique=False)
    op.create_index('ix_chat_messages_intent', 'chat_messages', ['intent'], unique=False)
    op.create_index('ix_chat_messages_created_at', 'chat_messages', ['created_at'], unique=False)
    op.create_index('ix_chat_messages_user_created', 'chat_messages', ['user_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_chat_messages_user_created', table_name='chat_messages')
    op.drop_index('ix_chat_messages_created_at', table_name='chat_messages')
    op.drop_index('ix_chat_messages_intent', table_name='chat_messages')
    op.drop_index('ix_chat_messages_role', table_name='chat_messages')
    op.drop_index('ix_chat_messages_user_id', table_name='chat_messages')
    op.drop_index('ix_chat_messages_id', table_name='chat_messages')
    op.drop_table('chat_messages')
