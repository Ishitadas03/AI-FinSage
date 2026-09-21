"""Add refresh_sessions table for token revocation tracking

Revision ID: 002_add_refresh_sessions
Revises: 001_initial_user
Create Date: 2026-09-21 21:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_add_refresh_sessions'
down_revision: Union[str, None] = '001_initial_user'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'refresh_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_sessions_id'), 'refresh_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_refresh_sessions_user_id'), 'refresh_sessions', ['user_id'], unique=False)
    op.create_index(op.f('ix_refresh_sessions_token_hash'), 'refresh_sessions', ['token_hash'], unique=False)
    op.create_index(op.f('ix_refresh_sessions_is_revoked'), 'refresh_sessions', ['is_revoked'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_refresh_sessions_is_revoked'), table_name='refresh_sessions')
    op.drop_index(op.f('ix_refresh_sessions_token_hash'), table_name='refresh_sessions')
    op.drop_index(op.f('ix_refresh_sessions_user_id'), table_name='refresh_sessions')
    op.drop_index(op.f('ix_refresh_sessions_id'), table_name='refresh_sessions')
    op.drop_table('refresh_sessions')
