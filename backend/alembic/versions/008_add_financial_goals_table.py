"""Add financial goals table

Revision ID: 008_add_financial_goals
Revises: 007_add_loans
Create Date: 2026-09-23 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '008_add_financial_goals'
down_revision: Union[str, None] = '007_add_loans'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'financial_goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('goal_type', sa.String(length=50), nullable=False),
        sa.Column('target_amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('current_amount', sa.Numeric(precision=18, scale=2), server_default='0.00', nullable=False),
        sa.Column('target_date', sa.Date(), nullable=False),
        sa.Column('priority', sa.String(length=20), server_default='medium', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_financial_goals_user_id_users', ondelete='CASCADE'),
        sa.CheckConstraint('target_amount > 0', name='ck_financial_goals_target_amount_positive'),
        sa.CheckConstraint('current_amount >= 0', name='ck_financial_goals_current_amount_non_negative'),
        sa.CheckConstraint('current_amount <= target_amount', name='ck_financial_goals_current_lte_target'),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high')", name='ck_financial_goals_priority'),
        sa.CheckConstraint("status IN ('active', 'completed', 'paused', 'cancelled')", name='ck_financial_goals_status'),
        sa.CheckConstraint(
            "goal_type IN ('emergency_fund', 'education', 'travel', 'vehicle', 'home', 'retirement', 'investment', 'purchase', 'other')",
            name='ck_financial_goals_goal_type',
        ),
    )
    op.create_index(op.f('ix_financial_goals_id'), 'financial_goals', ['id'], unique=False)
    op.create_index(op.f('ix_financial_goals_user_id'), 'financial_goals', ['user_id'], unique=False)
    op.create_index(op.f('ix_financial_goals_status'), 'financial_goals', ['status'], unique=False)
    op.create_index(op.f('ix_financial_goals_target_date'), 'financial_goals', ['target_date'], unique=False)
    op.create_index('ix_financial_goals_user_id_status', 'financial_goals', ['user_id', 'status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_financial_goals_user_id_status', table_name='financial_goals')
    op.drop_index(op.f('ix_financial_goals_target_date'), table_name='financial_goals')
    op.drop_index(op.f('ix_financial_goals_status'), table_name='financial_goals')
    op.drop_index(op.f('ix_financial_goals_user_id'), table_name='financial_goals')
    op.drop_index(op.f('ix_financial_goals_id'), table_name='financial_goals')
    op.drop_table('financial_goals')
