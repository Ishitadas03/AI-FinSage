"""Add financial goal contributions table

Revision ID: 009_add_goal_contributions
Revises: 008_add_financial_goals
Create Date: 2026-09-23 19:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '009_add_goal_contributions'
down_revision: Union[str, None] = '008_add_financial_goals'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'financial_goal_contributions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('contribution_date', sa.Date(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['goal_id'], ['financial_goals.id'], name='fk_goal_contributions_goal_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_goal_contributions_user_id', ondelete='CASCADE'),
        sa.CheckConstraint('amount > 0', name='ck_goal_contributions_amount_positive'),
    )
    op.create_index(op.f('ix_financial_goal_contributions_id'), 'financial_goal_contributions', ['id'], unique=False)
    op.create_index(op.f('ix_financial_goal_contributions_goal_id'), 'financial_goal_contributions', ['goal_id'], unique=False)
    op.create_index(op.f('ix_financial_goal_contributions_user_id'), 'financial_goal_contributions', ['user_id'], unique=False)
    op.create_index(op.f('ix_financial_goal_contributions_contribution_date'), 'financial_goal_contributions', ['contribution_date'], unique=False)
    op.create_index('ix_goal_contributions_goal_date', 'financial_goal_contributions', ['goal_id', 'contribution_date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_goal_contributions_goal_date', table_name='financial_goal_contributions')
    op.drop_index(op.f('ix_financial_goal_contributions_contribution_date'), table_name='financial_goal_contributions')
    op.drop_index(op.f('ix_financial_goal_contributions_user_id'), table_name='financial_goal_contributions')
    op.drop_index(op.f('ix_financial_goal_contributions_goal_id'), table_name='financial_goal_contributions')
    op.drop_index(op.f('ix_financial_goal_contributions_id'), table_name='financial_goal_contributions')
    op.drop_table('financial_goal_contributions')
