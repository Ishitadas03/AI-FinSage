import pytest
from app.schemas.transaction import TransactionCategory, TransactionType
from app.services.merchant_categorizer_service import MerchantCategorizerService


@pytest.mark.parametrize(
    "raw_text,tx_type,expected_merchant,expected_category",
    [
        # Food & Dining
        ("UPI/402918239/Swiggy/HDFC/pay", TransactionType.EXPENSE, "Swiggy", TransactionCategory.FOOD.value),
        ("SWIGGY*ORDER123 BANGALORE", TransactionType.EXPENSE, "Swiggy", TransactionCategory.FOOD.value),
        ("ZOMATO RESTAURANTS PVT LTD", TransactionType.EXPENSE, "Zomato", TransactionCategory.FOOD.value),
        ("POS 9123 DOMINOS PIZZA KORAMANGALA", TransactionType.EXPENSE, "Domino's Pizza", TransactionCategory.FOOD.value),
        ("MCDONALDS CONNAUGHT PLACE", TransactionType.EXPENSE, "McDonald's", TransactionCategory.FOOD.value),
        ("STARBUCKS COFFEE INDIRANAGAR", TransactionType.EXPENSE, "Starbucks", TransactionCategory.FOOD.value),
        ("KFC CHICKEN MG ROAD", TransactionType.EXPENSE, "KFC / Pizza Hut", TransactionCategory.FOOD.value),
        
        # Groceries
        ("Blinkit Commerce Gurgaon", TransactionType.EXPENSE, "Blinkit", TransactionCategory.FOOD.value),
        ("Zepto 10min Groceries", TransactionType.EXPENSE, "Zepto", TransactionCategory.FOOD.value),
        ("BIGBASKET TATA DIGITAL", TransactionType.EXPENSE, "BigBasket", TransactionCategory.FOOD.value),
        ("DMART AVENUE SUPERMARTS MUMBAI", TransactionType.EXPENSE, "DMart", TransactionCategory.FOOD.value),
        ("INSTAMART ORDER #9921", TransactionType.EXPENSE, "Swiggy", TransactionCategory.FOOD.value),
        
        # Transportation & Fuel
        ("UBER * TRIP 9918", TransactionType.EXPENSE, "Uber", TransactionCategory.TRANSPORT.value),
        ("Ola Cabs Bengaluru", TransactionType.EXPENSE, "Ola Cabs", TransactionCategory.TRANSPORT.value),
        ("RAPIDO BIKE TAXI", TransactionType.EXPENSE, "Rapido", TransactionCategory.TRANSPORT.value),
        ("IRCTC RAIL TICKETING NEW DELHI", TransactionType.EXPENSE, "IRCTC", TransactionCategory.TRANSPORT.value),
        ("MAKEMYTRIP INDIA PVT LTD", TransactionType.EXPENSE, "MakeMyTrip / Travel", TransactionCategory.TRANSPORT.value),
        ("HPCL PETROL PUMP WHITEFIELD", TransactionType.EXPENSE, "Hindustan Petroleum", TransactionCategory.TRANSPORT.value),
        ("INDIAN OIL AUTO FUEL KORM", TransactionType.EXPENSE, "Indian Oil", TransactionCategory.TRANSPORT.value),
        ("BPCL FUEL STATION", TransactionType.EXPENSE, "Bharat Petroleum", TransactionCategory.TRANSPORT.value),
        
        # Shopping & E-Commerce
        ("AMAZON PAY INDIA PVT LTD", TransactionType.EXPENSE, "Amazon", TransactionCategory.SHOPPING.value),
        ("FLIPKART INTERNET PVT LTD", TransactionType.EXPENSE, "Flipkart", TransactionCategory.SHOPPING.value),
        ("MYNTRA DESIGNS BLR", TransactionType.EXPENSE, "Myntra", TransactionCategory.SHOPPING.value),
        ("AJIO RELIANCE RETAIL", TransactionType.EXPENSE, "Ajio / Reliance Retail", TransactionCategory.SHOPPING.value),
        ("NYKAA E-RETAIL MUMBAI", TransactionType.EXPENSE, "Nykaa", TransactionCategory.SHOPPING.value),
        ("TATA CLIQ ECOMMERCE", TransactionType.EXPENSE, "Tata CLiQ", TransactionCategory.SHOPPING.value),
        ("IKEA INDIA STORE HYD", TransactionType.EXPENSE, "IKEA", TransactionCategory.SHOPPING.value),
        
        # Utilities & Telecom
        ("AIRTEL PREPAID RECHARGE", TransactionType.EXPENSE, "Airtel", TransactionCategory.BILLS.value),
        ("JIO DIGITAL LIFE MUMBAI", TransactionType.EXPENSE, "Jio", TransactionCategory.BILLS.value),
        ("VI VODAFONE BILL PAY", TransactionType.EXPENSE, "Vi Telecom", TransactionCategory.BILLS.value),
        ("TATA PLAY DTH RECHARGE", TransactionType.EXPENSE, "Broadband / DTH", TransactionCategory.BILLS.value),
        ("BESCOM ELECTRICITY BILL BANGALORE", TransactionType.EXPENSE, "Electricity Utility", TransactionCategory.BILLS.value),
        
        # Entertainment & Subscriptions
        ("NETFLIX ENTERTAINMENT SVCS", TransactionType.EXPENSE, "Netflix", TransactionCategory.ENTERTAINMENT.value),
        ("SPOTIFY INDIA SUBSCRIPTION", TransactionType.EXPENSE, "Spotify", TransactionCategory.ENTERTAINMENT.value),
        ("HOTSTAR DISNEY PLUS SUB", TransactionType.EXPENSE, "Disney+ Hotstar", TransactionCategory.ENTERTAINMENT.value),
        ("BOOKMYSHOW BIGTREE ENT", TransactionType.EXPENSE, "BookMyShow", TransactionCategory.ENTERTAINMENT.value),
        ("YOUTUBE PREMIUM GOOGLE", TransactionType.EXPENSE, "YouTube Premium", TransactionCategory.ENTERTAINMENT.value),
        
        # Healthcare & Fitness
        ("APOLLO PHARMACY BANGALORE", TransactionType.EXPENSE, "Apollo Healthcare", TransactionCategory.HEALTHCARE.value),
        ("PHARMEASY HEALTHCARE MUMBAI", TransactionType.EXPENSE, "Online Pharmacy", TransactionCategory.HEALTHCARE.value),
        ("1MG TATA DIGITAL GURGAON", TransactionType.EXPENSE, "Tata 1mg", TransactionCategory.HEALTHCARE.value),
        ("CULTFIT FITNESS CUREFIT", TransactionType.EXPENSE, "Cult.fit / Gym", TransactionCategory.HEALTHCARE.value),
        
        # Investments & Wealth
        ("ZERODHA BROKING LTD BLR", TransactionType.EXPENSE, "Zerodha", TransactionCategory.INVESTMENT.value),
        ("GROWW NEXTBILLION TECH", TransactionType.EXPENSE, "Groww", TransactionCategory.INVESTMENT.value),
        ("UPSTOX RKSV SECURITIES", TransactionType.EXPENSE, "Upstox", TransactionCategory.INVESTMENT.value),
        
        # Income & Salary
        ("ACH/ACME CORP/SALARY MAR 2024", TransactionType.INCOME, "Salary Inflow", TransactionCategory.SALARY.value),
        ("MONTHLY SALARY CREDIT INFOSYS", TransactionType.INCOME, "Salary Inflow", TransactionCategory.SALARY.value),
        ("PAYROLL DEPOSIT GOOGLE INDIA", TransactionType.INCOME, "Salary Inflow", TransactionCategory.SALARY.value),
        ("DIVIDEND PAYOUT TCS LTD", TransactionType.INCOME, "Income / Consulting", TransactionCategory.SALARY.value),
        
        # EMI & Loans
        ("HDFC BANK HOME LOAN EMI", TransactionType.EXPENSE, "Home Loan EMI", TransactionCategory.EMI.value),
        ("BAJAJ FINANCE AUTO EMI ACH", TransactionType.EXPENSE, "Bajaj Finance", TransactionCategory.EMI.value),
        
        # Insurance
        ("HDFC ERGO GENERAL INSURANCE", TransactionType.EXPENSE, "Health & General Insurance", TransactionCategory.INSURANCE.value),
        ("LIC OF INDIA PREMIUM MUMBAI", TransactionType.EXPENSE, "LIC", TransactionCategory.INSURANCE.value),
        ("MAX LIFE INSURANCE ONLINE", TransactionType.EXPENSE, "Life Insurance", TransactionCategory.INSURANCE.value),
        
        # ATM Cash
        ("ATM CASH WITHDRAWAL SBI KORAMANGALA", TransactionType.EXPENSE, "ATM Cash Withdrawal", TransactionCategory.CASH.value),
    ],
)
def test_merchant_categorization_rules(raw_text: str, tx_type: TransactionType, expected_merchant: str, expected_category: str):
    merchant, category = MerchantCategorizerService.categorize(raw_text, tx_type=tx_type)
    assert merchant == expected_merchant
    assert category == expected_category


def test_upi_fallback_clean_extraction():
    raw_upi = "UPI/9876543210/CafeCoffeeShop/SBI/Payment"
    merchant, category = MerchantCategorizerService.categorize(raw_upi)
    assert merchant == "Cafecoffeeshop"


def test_pos_card_fallback_clean_extraction():
    raw_pos = "POS 0004918 BAKERY DELIGHT WHITEFIELD"
    merchant, category = MerchantCategorizerService.categorize(raw_pos)
    assert merchant == "Bakery Delight Whitefield"
    assert category == "food"  # Matches 'bakery' generic keyword


def test_unmatched_garbage_falls_back_safely():
    merchant, category = MerchantCategorizerService.categorize("???---***")
    assert merchant is None
    assert category is None
