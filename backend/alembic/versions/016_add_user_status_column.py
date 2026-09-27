"""Add status column to users table for deletion lifecycle

Revision ID: 016_add_user_status_column
Revises: 015_user_profile_audit_logs
Create Date: 2026-09-27 13:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '016_add_user_status_column'
down_revision: Union[str, None] = '015_user_profile_audit_logs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('status', sa.String(length=50), nullable=False, server_default='active'))
    op.create_index(op.f('ix_users_status'), 'users', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_status'), table_name='users')
    op.drop_column('users', 'status')
