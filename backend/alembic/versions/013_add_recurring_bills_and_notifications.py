"""Add recurring_bills and notifications tables

Revision ID: 013_recurring_bills_notifs
Revises: 012_add_clerk_user_id
Create Date: 2026-09-27 10:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '013_recurring_bills_notifs'
down_revision: Union[str, None] = '012_add_clerk_user_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create recurring_bills table
    op.create_table(
        'recurring_bills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('account_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('merchant', sa.String(length=255), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=False, server_default='bills'),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('frequency', sa.String(length=30), nullable=False, server_default='monthly'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='active'),
        sa.Column('auto_post', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('last_posted_date', sa.Date(), nullable=True),
        sa.Column('reminder_days_before', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('amount > 0', name='ck_recurring_bills_amount_positive'),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='ck_recurring_bills_date_range'),
        sa.CheckConstraint(
            "frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annual', 'annual')",
            name='ck_recurring_bills_frequency',
        ),
        sa.CheckConstraint(
            "status IN ('active', 'paused', 'cancelled')",
            name='ck_recurring_bills_status',
        ),
    )
    op.create_index(op.f('ix_recurring_bills_id'), 'recurring_bills', ['id'], unique=False)
    op.create_index(op.f('ix_recurring_bills_user_id'), 'recurring_bills', ['user_id'], unique=False)
    op.create_index(op.f('ix_recurring_bills_account_id'), 'recurring_bills', ['account_id'], unique=False)
    op.create_index(op.f('ix_recurring_bills_category'), 'recurring_bills', ['category'], unique=False)
    op.create_index(op.f('ix_recurring_bills_next_due_date'), 'recurring_bills', ['next_due_date'], unique=False)
    op.create_index(op.f('ix_recurring_bills_status'), 'recurring_bills', ['status'], unique=False)
    op.create_index(
        'ix_recurring_bills_user_status_due',
        'recurring_bills',
        ['user_id', 'status', 'next_due_date'],
        unique=False,
    )

    # 2. Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False, server_default='system'),
        sa.Column('reference_id', sa.String(length=255), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint(
            "type IN ('bill_upcoming', 'bill_overdue', 'bill_paid', 'security', 'goal', 'insight', 'budget_alert', 'system')",
            name='ck_notifications_type',
        ),
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index(op.f('ix_notifications_type'), 'notifications', ['type'], unique=False)
    op.create_index(op.f('ix_notifications_reference_id'), 'notifications', ['reference_id'], unique=False)
    op.create_index(op.f('ix_notifications_is_read'), 'notifications', ['is_read'], unique=False)
    op.create_index(op.f('ix_notifications_created_at'), 'notifications', ['created_at'], unique=False)
    op.create_index(
        'ix_notifications_user_read_created',
        'notifications',
        ['user_id', 'is_read', 'created_at'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('recurring_bills')
