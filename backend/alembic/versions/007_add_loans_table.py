"""Add loans table

Revision ID: 007_add_loans
Revises: 006_add_credit_limit
Create Date: 2026-09-22 22:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '007_add_loans'
down_revision: Union[str, None] = '006_add_credit_limit'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'loans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('principal_amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('outstanding_principal', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('interest_rate', sa.Numeric(precision=8, scale=4), nullable=False),
        sa.Column('tenure_months', sa.Integer(), nullable=False),
        sa.Column('monthly_emi', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_loans_user_id_users', ondelete='CASCADE'),
        sa.CheckConstraint('principal_amount > 0', name='ck_loans_principal_amount_positive'),
        sa.CheckConstraint('outstanding_principal >= 0', name='ck_loans_outstanding_principal_non_negative'),
        sa.CheckConstraint('outstanding_principal <= principal_amount', name='ck_loans_outstanding_lte_principal'),
        sa.CheckConstraint('interest_rate >= 0', name='ck_loans_interest_rate_non_negative'),
        sa.CheckConstraint('tenure_months > 0', name='ck_loans_tenure_months_positive'),
        sa.CheckConstraint('monthly_emi > 0', name='ck_loans_monthly_emi_positive'),
        sa.CheckConstraint('end_date IS NULL OR end_date >= start_date', name='ck_loans_end_date_gte_start_date'),
    )
    op.create_index(op.f('ix_loans_id'), 'loans', ['id'], unique=False)
    op.create_index(op.f('ix_loans_user_id'), 'loans', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_loans_user_id'), table_name='loans')
    op.drop_index(op.f('ix_loans_id'), table_name='loans')
    op.drop_table('loans')
