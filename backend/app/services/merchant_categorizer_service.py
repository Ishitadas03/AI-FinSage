import re
from typing import Optional, Tuple
from app.schemas.transaction import TransactionCategory, TransactionType


# Rule dictionary: (Regex Pattern, Clean Merchant Name, TransactionCategory, optional TransactionType override)
MERCHANT_RULES = [
    # ------------------ Food & Dining ------------------
    (r"\b(?:SWIGGY|BUNDL\s*TECH|INSTAMART)\b", "Swiggy", TransactionCategory.FOOD),
    (r"\b(?:ZOMATO|HYPERPURE|ETERNAL)\b", "Zomato", TransactionCategory.FOOD),
    (r"\b(?:BLINKIT|GROFERS)\b", "Blinkit", TransactionCategory.FOOD),
    (r"\b(?:ZEPTO|KIRANAKART)\b", "Zepto", TransactionCategory.FOOD),
    (r"\b(?:BIGBASKET|BB\s*DAILY|INNOVATIVE\s*RETAIL)\b", "BigBasket", TransactionCategory.FOOD),
    (r"\b(?:DMART|AVENUE\s*SUPERMARTS)\b", "DMart", TransactionCategory.FOOD),
    (r"\b(?:STARBUCKS|TATA\s*STARBUCKS)\b", "Starbucks", TransactionCategory.FOOD),
    (r"\b(?:MCDONALD|MCDONALDS|HARDCASTLE)\b", "McDonald's", TransactionCategory.FOOD),
    (r"\b(?:DOMINO|DOMINOS|JUBILANT\s*FOOD)\b", "Domino's Pizza", TransactionCategory.FOOD),
    (r"\b(?:KFC|PIZZA\s*HUT|DEVYANI|SAPPHIRE\s*FOODS)\b", "KFC / Pizza Hut", TransactionCategory.FOOD),
    (r"\b(?:BURGER\s*KING|SUBWAY|HALDIRAM|CHAAYOS|CHAI\s*POINT|CAFE\s*COFFEE\s*DAY)\b", "Cafe / Quick Bite", TransactionCategory.FOOD),
    (r"\b(?:NATURES\s*BASKET|MORE\s*RETAIL|SPENCERS)\b", "Supermarket & Groceries", TransactionCategory.FOOD),

    # ------------------ Transportation & Fuel ------------------
    (r"\b(?:UBER|UBER\s*INDIA)\b", "Uber", TransactionCategory.TRANSPORT),
    (r"\b(?:OLA|ANI\s*TECH)\b", "Ola Cabs", TransactionCategory.TRANSPORT),
    (r"\b(?:RAPIDO|ROPPEN\s*TRANSPORT)\b", "Rapido", TransactionCategory.TRANSPORT),
    (r"\b(?:BLUSMART)\b", "BluSmart Mobility", TransactionCategory.TRANSPORT),
    (r"\b(?:INDIAN\s*OIL|IOCL)\b", "Indian Oil", TransactionCategory.TRANSPORT),
    (r"\b(?:BHARAT\s*PETROLEUM|BPCL)\b", "Bharat Petroleum", TransactionCategory.TRANSPORT),
    (r"\b(?:HINDUSTAN\s*PETROLEUM|HPCL)\b", "Hindustan Petroleum", TransactionCategory.TRANSPORT),
    (r"\b(?:SHELL\s*PETROL|SHELL\s*INDIA|SHELL)\b", "Shell Fuel", TransactionCategory.TRANSPORT),
    (r"\b(?:PETROL|DIESEL|CNG\s*STATION|FUEL\s*PUMP)\b", "Fuel Station", TransactionCategory.TRANSPORT),
    (r"\b(?:IRCTC|INDIAN\s*RAILWAYS)\b", "IRCTC", TransactionCategory.TRANSPORT),
    (r"\b(?:MAKEMYTRIP|MMT|GOIBIBO|EASEMYTRIP|YATRA)\b", "MakeMyTrip / Travel", TransactionCategory.TRANSPORT),
    (r"\b(?:INDIGO|INTERGLOBE|AIR\s*INDIA|SPICEJET|VISTARA|AKASA\s*AIR)\b", "Airline Ticket", TransactionCategory.TRANSPORT),
    (r"\b(?:FASTAG|NETC\s*FASTAG|IHMCL|TOLL\s*PLAZA)\b", "FASTag Toll", TransactionCategory.TRANSPORT),
    (r"\b(?:NMMT|BMRC|DMRC|METRO\s*RAIL|NCMC)\b", "Metro / City Transit", TransactionCategory.TRANSPORT),

    # ------------------ Shopping & E-Commerce ------------------
    (r"\b(?:AMAZON|AMZN|AMAZON\s*PAY|AMAZON\s*SELLER)\b", "Amazon", TransactionCategory.SHOPPING),
    (r"\b(?:FLIPKART|FKART)\b", "Flipkart", TransactionCategory.SHOPPING),
    (r"\b(?:MYNTRA)\b", "Myntra", TransactionCategory.SHOPPING),
    (r"\b(?:AJIO|RELIANCE\s*RETAIL)\b", "Ajio / Reliance Retail", TransactionCategory.SHOPPING),
    (r"\b(?:TATA\s*CLIQ|TATACLIQ)\b", "Tata CLiQ", TransactionCategory.SHOPPING),
    (r"\b(?:NYKAA|FSN\s*E-COMMERCE)\b", "Nykaa", TransactionCategory.SHOPPING),
    (r"\b(?:MEESHO|FASHNEAR)\b", "Meesho", TransactionCategory.SHOPPING),
    (r"\b(?:DECATHLON)\b", "Decathlon", TransactionCategory.SHOPPING),
    (r"\b(?:IKEA)\b", "IKEA", TransactionCategory.SHOPPING),
    (r"\b(?:ZARA|INDITEX|H&M|HENNES|UNIQLO|WESTSIDE|TRENT|PANTALOONS|MAX\s*FASHION|LIFESTYLE)\b", "Fashion & Retail", TransactionCategory.SHOPPING),
    (r"\b(?:CROMA|INFINITI\s*RETAIL|RELIANCE\s*DIGITAL|VIJAY\s*SALES)\b", "Electronics & Gadgets", TransactionCategory.SHOPPING),

    # ------------------ Bills & Utilities ------------------
    (r"\b(?:AIRTEL|BHARTI\s*AIRTEL)\b", "Airtel", TransactionCategory.BILLS),
    (r"\b(?:JIO|RELIANCE\s*JIO|JIO\s*FIBER)\b", "Jio", TransactionCategory.BILLS),
    (r"\b(?:VODAFONE|VI\s*PREPAID|VI\s*POSTPAID)\b", "Vi Telecom", TransactionCategory.BILLS),
    (r"\b(?:ACT\s*FIBERNET|ACT\s*CORP|HATHWAY|TATA\s*PLAY)\b", "Broadband / DTH", TransactionCategory.BILLS),
    (r"\b(?:BESCOM|TATA\s*POWER|ADANI\s*ELECTRICITY|MSEB|MSEDCL|BSES|CESC|UPPCL)\b", "Electricity Utility", TransactionCategory.BILLS),
    (r"\b(?:MAHANAGAR\s*GAS|MGL|IGL|INDRA\s*PRASTHA\s*GAS|GUJARAT\s*GAS)\b", "Piped Gas Utility", TransactionCategory.BILLS),
    (r"\b(?:BILLDESK|BBPS)\b", "Utility BillDesk", TransactionCategory.BILLS),

    # ------------------ Rent & Housing ------------------
    (r"\b(?:NOBROKER\s*RENT|CRED\s*RENT|MAGICBRICKS|HOUSING\.COM|RENT\s*PAYMENT|HOUSE\s*RENT)\b", "House Rent", TransactionCategory.RENT),
    (r"\b(?:SOCIETY\s*MAINTENANCE|APARTMENT\s*MAINTENANCE)\b", "Society Maintenance", TransactionCategory.RENT),

    # ------------------ Entertainment & Subscriptions ------------------
    (r"\b(?:NETFLIX)\b", "Netflix", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:SPOTIFY)\b", "Spotify", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:BOOKMYSHOW|BIGTREE\s*ENTERTAINMENT)\b", "BookMyShow", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:HOTSTAR|DISNEY\s*HOTSTAR|NOVI\s*DIGITAL)\b", "Disney+ Hotstar", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:PRIME\s*VIDEO|AMAZON\s*DIGITAL)\b", "Prime Video", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:SONYLIV|ZEE5|VOOT|JIO\s*CINEMA)\b", "OTT Entertainment", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:YOUTUBE\s*PREMIUM|GOOGLE\s*YOUTUBE)\b", "YouTube Premium", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:APPLE\.COM/BILL|ITUNES|GOOGLE\s*PLAY)\b", "App Store / Digital Pass", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:PVR|INOX|CINEPOLIS|PVR\s*INOX)\b", "Movie Cinema", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:STEAM\s*GAMES|PLAYSTATION|SONY\s*INTERACTIVE|XBOX)\b", "Gaming & Media", TransactionCategory.ENTERTAINMENT),

    # ------------------ Healthcare & Wellness ------------------
    (r"\b(?:APOLLO\s*PHARMACY|APOLLO\s*HOSPITAL|APOLLO)\b", "Apollo Healthcare", TransactionCategory.HEALTHCARE),
    (r"\b(?:1MG|TATA\s*1MG|1MG\s*TECH)\b", "Tata 1mg", TransactionCategory.HEALTHCARE),
    (r"\b(?:PHARMEASY|NETMEDS|MEDPLUS)\b", "Online Pharmacy", TransactionCategory.HEALTHCARE),
    (r"\b(?:DR\s*LAL\s*PATHLABS|THYROCARE|METROPOLIS)\b", "Diagnostic Lab", TransactionCategory.HEALTHCARE),
    (r"\b(?:PRACTO|FORTIS|MAX\s*HEALTHCARE|MANIPAL\s*HOSPITAL|NARAYANA\s*HEALTH)\b", "Hospital & Doctor", TransactionCategory.HEALTHCARE),
    (r"\b(?:CULT\.FIT|CULTFIT|CUREFIT|GOLD\s*GYM|ANYTIME\s*FITNESS)\b", "Cult.fit / Gym", TransactionCategory.HEALTHCARE),

    # ------------------ Investments ------------------
    (r"\b(?:ZERODHA|ZERODHA\s*BROKING)\b", "Zerodha", TransactionCategory.INVESTMENT),
    (r"\b(?:GROWW|NEXTBILLION\s*TECH)\b", "Groww", TransactionCategory.INVESTMENT),
    (r"\b(?:UPSTOX|RKSV\s*SECURITIES)\b", "Upstox", TransactionCategory.INVESTMENT),
    (r"\b(?:ANGEL\s*ONE|ANGEL\s*BROKING)\b", "Angel One", TransactionCategory.INVESTMENT),
    (r"\b(?:INDMONEY|KUVERA|COIN\s*ZERODHA)\b", "Investment Platform", TransactionCategory.INVESTMENT),
    (r"\b(?:CAMS|KFINTECH|MUTUAL\s*FUND|NIPPON\s*INDIA|HDFC\s*AMC|ICICI\s*PRUDENTIAL\s*MF|SBI\s*MUTUAL\s*FUND|PARAG\s*PARIKH|PPFAS)\b", "Mutual Fund SIP", TransactionCategory.INVESTMENT),

    # ------------------ Loans & EMI ------------------
    (r"\b(?:BAJAJ\s*FINANCE|BAJAJ\s*FINSERV)\b", "Bajaj Finance", TransactionCategory.EMI),
    (r"\b(?:HOME\s*LOAN\s*EMI|HDFC\s*HOME\s*LOAN|SBI\s*HOME\s*LOAN|ICICI\s*HOME\s*LOAN)\b", "Home Loan EMI", TransactionCategory.EMI),
    (r"\b(?:CAR\s*LOAN|AUTO\s*LOAN|VEHICLE\s*LOAN)\b", "Auto Loan EMI", TransactionCategory.EMI),
    (r"\b(?:PERSONAL\s*LOAN|KREDITBEE|MONEYVIEW|EARLYSALARY|FIBE)\b", "Personal Loan EMI", TransactionCategory.EMI),
    (r"\b(?:TVS\s*CREDIT|MUTHOOT|MANAPPURAM)\b", "Loan / Finance EMI", TransactionCategory.EMI),
    (r"\b(?:ACH\s*DR\s*LOAN|NACH\s*LOAN|ECS\s*DEBIT\s*LOAN)\b", "Bank Loan EMI", TransactionCategory.EMI),

    # ------------------ Insurance ------------------
    (r"\b(?:LIC\s*OF\s*INDIA|LIC\s*PREMIUM|LIFE\s*INSURANCE\s*CORP)\b", "LIC", TransactionCategory.INSURANCE),
    (r"\b(?:HDFC\s*LIFE|ICICI\s*PRU|SBI\s*LIFE|MAX\s*LIFE|TATA\s*AIA)\b", "Life Insurance", TransactionCategory.INSURANCE),
    (r"\b(?:STAR\s*HEALTH|CARE\s*HEALTH|NIVA\s*BUPA|HDFC\s*ERGO|ICICI\s*LOMBARD|ACKO|DIGIT\s*INSURANCE|POLICYBAZAAR)\b", "Health & General Insurance", TransactionCategory.INSURANCE),

    # ------------------ Salary / Income ------------------
    (r"\b(?:SALARY|SALARY\s*CREDIT|SALARY\s*FOR|MONTHLY\s*SALARY|PAYROLL|DIR\s*DEP\s*SALARY)\b", "Salary Inflow", TransactionCategory.SALARY),
    (r"\b(?:STIPEND|CONSULTING\s*FEE|CLIENT\s*PAYMENT|DIVIDEND\s*PAYOUT)\b", "Income / Consulting", TransactionCategory.SALARY),

    # ------------------ Cash Withdrawals ------------------
    (r"\b(?:ATM\s*CASH|ATM\s*WDL|ATM\s*DEBIT|CASH\s*WITHDRAWAL|SELF\s*WDL)\b", "ATM Cash Withdrawal", TransactionCategory.CASH),

    # ------------------ Education ------------------
    (r"\b(?:UDEMY|COURSERA|EDX|UPGRAD|SIMPLILEARN|UNACADEMY|BYJU|ALLEN|AAKASH)\b", "Online Learning", TransactionCategory.EDUCATION),
    (r"\b(?:SCHOOL\s*FEE|COLLEGE\s*FEE|UNIVERSITY\s*FEE|TUITION\s*FEE)\b", "School / Tuition Fee", TransactionCategory.EDUCATION),
]

GENERIC_CATEGORY_KEYWORDS = [
    (r"\b(?:RESTAURANT|CAFE|BAKERY|FOOD|DINING|PIZZA|BURGER|SWEETS|HOTEL\s*DINE)\b", TransactionCategory.FOOD),
    (r"\b(?:CAB|TAXI|AUTO|BUS|METRO|TOLL|PETROL|DIESEL|FUEL|RAILWAY)\b", TransactionCategory.TRANSPORT),
    (r"\b(?:STORE|SUPERMARKET|MART|BAZAR|BAZAAR|MALL|CLOTHING|APPAREL)\b", TransactionCategory.SHOPPING),
    (r"\b(?:ELECTRICITY|WATER|BROADBAND|FIBER|DTH|MOBILE\s*BILL|UTILITY)\b", TransactionCategory.BILLS),
    (r"\b(?:CINEMA|MOVIE|THEATRE|GAMING|CONCERT|ENTERTAINMENT)\b", TransactionCategory.ENTERTAINMENT),
    (r"\b(?:PHARMACY|CHEMIST|CLINIC|HOSPITAL|DOCTOR|HEALTH|LAB|DIAGNOSTICS)\b", TransactionCategory.HEALTHCARE),
    (r"\b(?:MUTUAL\s*FUND|SECURITIES|BROKING|STOCKS|INVESTMENT|EQUITY|SIP)\b", TransactionCategory.INVESTMENT),
    (r"\b(?:LOAN|EMI|FINANCE\s*CHARGE|CREDIT\s*CARD\s*PAYMENT)\b", TransactionCategory.EMI),
    (r"\b(?:INSURANCE|POLICY\s*PREMIUM|ASSURANCE)\b", TransactionCategory.INSURANCE),
    (r"\b(?:SALARY|PAYROLL|STIPEND|HONORARIUM)\b", TransactionCategory.SALARY),
    (r"\b(?:RENT|LEASE|MAINTENANCE)\b", TransactionCategory.RENT),
    (r"\b(?:TUITION|COURSE|TRAINING|EXAM\s*FEE|SCHOOL|COLLEGE)\b", TransactionCategory.EDUCATION),
]


class MerchantCategorizerService:
    """
    Deterministic rule-based normalizer and categorizer for Indian financial transactions.
    """

    @classmethod
    def categorize(
        cls,
        description: Optional[str],
        raw_merchant: Optional[str] = None,
        tx_type: Optional[TransactionType] = None,
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Extract clean merchant name and assign TransactionCategory.
        
        Args:
            description: Raw narration or description string.
            raw_merchant: Extracted candidate merchant name (if any).
            tx_type: TransactionType (income, expense, transfer).
            
        Returns:
            Tuple of (clean_merchant_name, category_str).
        """
        combined_text = f"{raw_merchant or ''} {description or ''}".strip().upper()
        if not combined_text:
            return None, None

        # 1. Check known specific merchant rules
        for pattern, clean_name, category in MERCHANT_RULES:
            if re.search(pattern, combined_text, re.IGNORECASE):
                # Ensure category enum value string is returned
                cat_str = category.value if isinstance(category, TransactionCategory) else str(category)
                return clean_name, cat_str

        # 2. Extract structured candidate merchant name from UPI / POS narrations
        candidate_merchant = raw_merchant or cls._extract_candidate_from_narration(combined_text)

        # 3. Check generic category keywords
        inferred_cat_str: Optional[str] = None
        for pattern, category in GENERIC_CATEGORY_KEYWORDS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                inferred_cat_str = category.value if isinstance(category, TransactionCategory) else str(category)
                break

        # 4. Handle income/salary fallback
        if not inferred_cat_str and tx_type == TransactionType.INCOME:
            if any(w in combined_text for w in ["SALARY", "PAYROLL", "MONTHLY", "STIPEND", "INCOME"]):
                inferred_cat_str = TransactionCategory.SALARY.value

        # Return formatted candidate merchant and inferred category (or None)
        cleaned_merchant = candidate_merchant[:255] if candidate_merchant else None
        return cleaned_merchant, inferred_cat_str

    @classmethod
    def _extract_candidate_from_narration(cls, text: str) -> Optional[str]:
        """
        Heuristic extraction of merchant/payee from Indian bank narrations.
        """
        # UPI pattern 1: 'UPI/402918239/Swiggy/HDFC/...' or 'UPI/582910/MCDONALDS/...'
        upi_slash = re.match(r"^UPI[/\-][^/\-]+[/\-]([A-Z0-9\s\.\&\-]{3,30})[/\-]", text)
        if upi_slash:
            cand = upi_slash.group(1).strip()
            if not cand.isdigit() and cand not in {"IN", "PAYMENT", "TRANSFER", "UPI", "NA"}:
                return cls._to_title_case(cand)

        # UPI pattern 2: 'UPI-SWIGGY-1234@icici' or 'UPI/SWIGGY/1234'
        upi_dash = re.match(r"^UPI[/\-]([A-Z0-9\s]{3,25})[/\-@]", text)
        if upi_dash:
            cand = upi_dash.group(1).strip()
            if not cand.isdigit() and cand not in {"IN", "PAYMENT", "TRANSFER", "UPI", "NA"}:
                return cls._to_title_case(cand)

        # POS pattern: 'POS 4521 SWIGGY BANGALORE'
        pos_match = re.match(r"^POS\s+(?:\d+\s+)?([A-Z0-9\s]{3,25})\b", text)
        if pos_match:
            cand = pos_match.group(1).strip()
            # remove trailing city names if appended
            cand = re.sub(r"\b(?:BANGALORE|BENGALURU|MUMBAI|DELHI|HYDERABAD|CHENNAI|PUNE|KOLKATA|IN|IND)\b", "", cand).strip()
            if cand and not cand.isdigit():
                return cls._to_title_case(cand)

        # E-COMM: 'E-COMM/SWIGGY/1234'
        ecomm_match = re.match(r"^E-?COMM[/\-]([A-Z0-9\s]{3,25})[/\-]", text)
        if ecomm_match:
            cand = ecomm_match.group(1).strip()
            if cand and not cand.isdigit():
                return cls._to_title_case(cand)

        # Star prefix: 'SWIGGY*ORDER123'
        star_match = re.match(r"^([A-Z0-9\s]{3,25})[\*]", text)
        if star_match:
            cand = star_match.group(1).strip()
            if cand and cand not in {"POS", "UPI", "NEFT", "IMPS", "ACH", "BILLDESK", "PAYTM", "RTGS"}:
                return cls._to_title_case(cand)

        return None

    @staticmethod
    def _to_title_case(val: str) -> str:
        """Helper to convert uppercase merchant string to clean Title Case."""
        words = val.split()
        return " ".join(w.capitalize() if not w.isupper() or len(w) > 4 else w for w in words)
