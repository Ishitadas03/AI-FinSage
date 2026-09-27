"""Add user profile fields and audit_logs table

Revision ID: 015_user_profile_audit_logs
Revises: 014_add_chat_messages
Create Date: 2026-09-27 12:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '015_user_profile_audit_logs'
down_revision: Union[str, None] = '014_add_chat_messages'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add persistent profile columns to users table
    op.add_column('users', sa.Column('phone', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('pan_number', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'))
    op.add_column('users', sa.Column('monthly_income', sa.Numeric(precision=18, scale=2), nullable=True))
    op.add_column('users', sa.Column('risk_appetite', sa.String(length=50), nullable=False, server_default='Moderate'))
    op.add_column('users', sa.Column('preferences', sa.JSON(), nullable=True, server_default='{}'))

    # 2. Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='general'),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('user_agent', sa.String(length=255), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_audit_logs_user_id'), 'audit_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_category'), 'audit_logs', ['category'], unique=False)
    op.create_index(op.f('ix_audit_logs_created_at'), 'audit_logs', ['created_at'], unique=False)
    op.create_index('ix_audit_logs_user_action', 'audit_logs', ['user_id', 'action'], unique=False)
    op.create_index('ix_audit_logs_user_created_at', 'audit_logs', ['user_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_audit_logs_user_created_at', table_name='audit_logs')
    op.drop_index('ix_audit_logs_user_action', table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_created_at'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_category'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_column('users', 'preferences')
    op.drop_column('users', 'risk_appetite')
    op.drop_column('users', 'monthly_income')
    op.drop_column('users', 'currency')
    op.drop_column('users', 'pan_number')
    op.drop_column('users', 'phone')
