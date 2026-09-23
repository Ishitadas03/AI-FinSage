"""Add financial budgets table

Revision ID: 010_add_financial_budgets
Revises: 009_add_goal_contributions
Create Date: 2026-09-23 19:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '010_add_financial_budgets'
down_revision: Union[str, None] = '009_add_goal_contributions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'financial_budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('period', sa.String(length=20), server_default='monthly', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_financial_budgets_user_id_users', ondelete='CASCADE'),
        sa.CheckConstraint('amount > 0', name='ck_financial_budgets_amount_positive'),
        sa.CheckConstraint('end_date >= start_date', name='ck_financial_budgets_date_range'),
        sa.CheckConstraint("period IN ('monthly', 'weekly')", name='ck_financial_budgets_period'),
        sa.CheckConstraint(
            "category IN ('salary', 'food', 'shopping', 'transport', 'bills', 'rent', 'entertainment', 'healthcare', 'education', 'investment', 'emi', 'insurance', 'cash', 'other')",
            name='ck_financial_budgets_category',
        ),
    )
    op.create_index(op.f('ix_financial_budgets_id'), 'financial_budgets', ['id'], unique=False)
    op.create_index(op.f('ix_financial_budgets_user_id'), 'financial_budgets', ['user_id'], unique=False)
    op.create_index(op.f('ix_financial_budgets_category'), 'financial_budgets', ['category'], unique=False)
    op.create_index(op.f('ix_financial_budgets_start_date'), 'financial_budgets', ['start_date'], unique=False)
    op.create_index(op.f('ix_financial_budgets_end_date'), 'financial_budgets', ['end_date'], unique=False)
    op.create_index('ix_financial_budgets_user_cat_start', 'financial_budgets', ['user_id', 'category', 'start_date'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_financial_budgets_user_cat_start', table_name='financial_budgets')
    op.drop_index(op.f('ix_financial_budgets_end_date'), table_name='financial_budgets')
    op.drop_index(op.f('ix_financial_budgets_start_date'), table_name='financial_budgets')
    op.drop_index(op.f('ix_financial_budgets_category'), table_name='financial_budgets')
    op.drop_index(op.f('ix_financial_budgets_user_id'), table_name='financial_budgets')
    op.drop_index(op.f('ix_financial_budgets_id'), table_name='financial_budgets')
    op.drop_table('financial_budgets')
