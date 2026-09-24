"""Add import fields and nullable category to transactions table

Revision ID: 011_add_import_fields
Revises: 010_add_financial_budgets
Create Date: 2026-09-24 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '011_add_import_fields'
down_revision: Union[str, None] = '010_add_financial_budgets'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make category nullable for imported/unclassified transactions
    op.alter_column('transactions', 'category', existing_type=sa.String(length=50), nullable=True)

    # Add reference, source, and import_fingerprint columns
    op.add_column('transactions', sa.Column('reference', sa.String(length=255), nullable=True))
    op.add_column('transactions', sa.Column('source', sa.String(length=50), nullable=True))
    op.add_column('transactions', sa.Column('import_fingerprint', sa.String(length=64), nullable=True))

    # Add index on import_fingerprint
    op.create_index(op.f('ix_transactions_import_fingerprint'), 'transactions', ['import_fingerprint'], unique=False)

    # Add unique partial index on (user_id, account_id, import_fingerprint) where import_fingerprint IS NOT NULL
    op.create_index(
        'uq_transactions_user_account_fingerprint',
        'transactions',
        ['user_id', 'account_id', 'import_fingerprint'],
        unique=True,
        postgresql_where=sa.text('import_fingerprint IS NOT NULL'),
    )


def downgrade() -> None:
    op.drop_index('uq_transactions_user_account_fingerprint', table_name='transactions')
    op.drop_index(op.f('ix_transactions_import_fingerprint'), table_name='transactions')
    op.drop_column('transactions', 'import_fingerprint')
    op.drop_column('transactions', 'source')
    op.drop_column('transactions', 'reference')
    op.alter_column('transactions', 'category', existing_type=sa.String(length=50), nullable=False)
