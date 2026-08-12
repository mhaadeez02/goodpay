import http.server
import socketserver
import json
import os
import random
import datetime
import traceback
from urllib.parse import parse_qs, urlparse

try:
    import pymongo
    from pymongo.errors import ConnectionFailure, DuplicateKeyError
except ImportError:
    print("pymongo is not installed! Run: pip install pymongo[srv]")
    pymongo = None

PORT = int(os.environ.get('PORT', 8000))
MONGO_URI = os.environ.get('MONGO_URI')

db = None
if MONGO_URI and pymongo:
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client.goodpay
        print("Connected to MongoDB Atlas successfully.")
        
        # Ensure unique indexes
        db.users.create_index("phone", unique=True)
        db.cards.create_index("user_id", unique=True)
    except Exception as e:
        print("Failed to connect to MongoDB:", e)

def get_db():
    if db is None:
        raise Exception("MongoDB is not connected. Please set MONGO_URI.")
    return db

def init_db():
    if db is None:
        return
    try:
        # Seed MFS Settings
        if not db.mfs_settings.find_one({"id": 1}):
            db.mfs_settings.insert_one({
                "id": 1,
                "bkash_number": "01794146475",
                "nagad_number": "01794146475",
                "rocket_number": "01794146475",
                "card_price_bdt": 1350.00,
                "usd_to_bdt_rate": 135.00,
                "cashout_charge_pct": 2.00,
                "card_activation_fee_usd": 8.00,
                "card_balance_credit_usd": 5.00,
                "updated_at": datetime.datetime.utcnow().isoformat()
            })
        
        # Seed Admin User
        if not db.admin_users.find_one({"username": "masud"}):
            db.admin_users.insert_one({
                "username": "masud",
                "password": "1516797685",
                "name": "Masud Admin"
            })
            
        print("Database initialized successfully.")
    except Exception as e:
        print("CRITICAL DATABASE ERROR ON STARTUP:", e)

init_db()

def generate_card_number():
    prefix = "4532 " + str(random.randint(1000, 9999)) + " " + str(random.randint(1000, 9999)) + " "
    last_four = str(random.randint(1000, 9999))
    return prefix + last_four

def generate_expiry():
    now = datetime.datetime.now()
    future_year = (now.year + 5) % 100
    month = f"{now.month:02d}"
    return f"{month}/{future_year:02d}"

def generate_cvv():
    return f"{random.randint(100, 999)}"

def generate_id():
    # Simple auto-increment approximation for MongoDB to maintain integer IDs
    if db is None: return random.randint(1000, 999999)
    counter = db.counters.find_one_and_update(
        {"_id": "entity_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER
    )
    return counter["seq"]

def convert_objectid(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

class GoodPayHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=directory, **kwargs)

    def guess_type(self, path):
        if str(path).endswith('.js'): return 'application/javascript; charset=utf-8'
        if str(path).endswith('.css'): return 'text/css; charset=utf-8'
        if str(path).endswith('.json') or str(path).endswith('.webmanifest'): return 'application/json; charset=utf-8'
        if str(path).endswith('.svg'): return 'image/svg+xml'
        return super().guess_type(path)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def respond_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def parse_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0: return {}
        body = self.rfile.read(content_length).decode('utf-8')
        try: return json.loads(body)
        except Exception: return parse_qs(body)

    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            query = parse_qs(parsed_url.query)

            if path == '/api/admin/status':
                if db is None:
                    return self.respond_json({'status': 'disconnected', 'message': 'MongoDB not initialized'})
                try:
                    db.client.admin.command('ping')
                    return self.respond_json({'status': 'connected'})
                except Exception:
                    return self.respond_json({'status': 'disconnected'})

            elif path == '/api/mfs-settings':
                database = get_db()
                row = database.mfs_settings.find_one({"id": 1})
                if row:
                    return self.respond_json({
                        'success': True,
                        'data': {
                            'bkash_number': row.get('bkash_number', ''),
                            'nagad_number': row.get('nagad_number', ''),
                            'rocket_number': row.get('rocket_number', ''),
                            'card_price_bdt': float(row.get('card_price_bdt', 1350)),
                            'usd_to_bdt_rate': float(row.get('usd_to_bdt_rate', 135)),
                            'cashout_charge_pct': float(row.get('cashout_charge_pct', 2)),
                            'card_activation_fee_usd': float(row.get('card_activation_fee_usd', 8)),
                            'card_balance_credit_usd': float(row.get('card_balance_credit_usd', 5))
                        }
                    })
                return self.respond_json({'success': False, 'message': 'MFS Settings not found'}, 404)

            elif path == '/api/user/profile':
                user_id = query.get('user_id', [None])[0]
                if not user_id: return self.respond_json({'success': False, 'message': 'User ID required'}, 400)
                database = get_db()
                user = database.users.find_one({"id": int(user_id)}, {"_id": 0})
                if not user: return self.respond_json({'success': False, 'message': 'User not found'}, 404)
                card = database.cards.find_one({"user_id": int(user_id)}, {"_id": 0})
                return self.respond_json({'success': True, 'user': user, 'card': card})

            elif path == '/api/user/history':
                user_id = query.get('user_id', [None])[0]
                if not user_id: return self.respond_json({'success': False, 'message': 'User ID required'}, 400)
                database = get_db()
                recharges = list(database.recharges.find({"user_id": int(user_id)}, {"_id": 0}))
                purchases = list(database.card_purchases.find({"user_id": int(user_id)}, {"_id": 0}))
                
                history = []
                for r in recharges:
                    r['type'] = 'recharge'
                    r['amount'] = r.get('usd_amount')
                    history.append(r)
                for p in purchases:
                    p['type'] = 'card_purchase'
                    p['amount'] = p.get('card_price')
                    p['total_bdt'] = p.get('card_price')
                    history.append(p)
                
                history.sort(key=lambda x: x.get('created_at', ''), reverse=True)
                return self.respond_json({'success': True, 'transactions': history})

            elif path == '/api/admin/users':
                database = get_db()
                users = list(database.users.find({}, {"_id": 0}).sort("id", pymongo.DESCENDING))
                for u in users:
                    card = database.cards.find_one({"user_id": u["id"]}, {"_id": 0})
                    if card:
                        u["card_number"] = card.get("card_number")
                        u["cvv"] = card.get("cvv")
                        u["expiry_date"] = card.get("expiry_date")
                        u["balance"] = card.get("balance")
                        u["card_status"] = card.get("status")
                return self.respond_json({'success': True, 'users': users})

            elif path == '/api/admin/user-details':
                user_id = query.get('user_id', [None])[0]
                if not user_id: return self.respond_json({'success': False, 'message': 'User ID required'}, 400)
                database = get_db()
                user = database.users.find_one({"id": int(user_id)}, {"_id": 0})
                if not user: return self.respond_json({'success': False, 'message': 'User not found'}, 404)
                card = database.cards.find_one({"user_id": int(user_id)}, {"_id": 0})
                
                recharges = list(database.recharges.find({"user_id": int(user_id)}, {"_id": 0}))
                purchases = list(database.card_purchases.find({"user_id": int(user_id)}, {"_id": 0}))
                history = []
                for r in recharges:
                    r['type'] = 'recharge'
                    r['amount'] = r.get('usd_amount')
                    history.append(r)
                for p in purchases:
                    p['type'] = 'card_purchase'
                    p['amount'] = p.get('card_price')
                    p['total_bdt'] = p.get('card_price')
                    history.append(p)
                history.sort(key=lambda x: x.get('created_at', ''), reverse=True)

                return self.respond_json({'success': True, 'user': user, 'card': card, 'history': history})

            elif path == '/api/admin/requests':
                database = get_db()
                all_requests = []
                
                purchases = list(database.card_purchases.find({}, {"_id": 0}))
                for p in purchases:
                    user = database.users.find_one({"id": p["user_id"]})
                    p['request_type'] = 'card_purchase'
                    p['user_phone'] = user.get('phone') if user else ''
                    p['usd_amount'] = None
                    p['total_bdt'] = p.get('card_price')
                    all_requests.append(p)
                    
                recharges = list(database.recharges.find({}, {"_id": 0}))
                for r in recharges:
                    user = database.users.find_one({"id": r["user_id"]})
                    r['request_type'] = 'recharge'
                    r['full_name'] = user.get('username') if user else ''
                    r['phone_number'] = user.get('phone') if user else ''
                    r['user_phone'] = user.get('phone') if user else ''
                    r['card_price'] = None
                    all_requests.append(r)

                all_requests.sort(key=lambda x: str(x.get('created_at', '')), reverse=True)
                return self.respond_json({'success': True, 'requests': all_requests})

            return super().do_GET()
        except Exception as e:
            traceback.print_exc()
            return self.respond_json({'success': False, 'message': str(e)}, 500)

    def do_POST(self):
        try:
            parsed_url = urlparse(self.path)
            path = parsed_url.path
            body = self.parse_body()

            if path == '/api/auth/register':
                username = str(body.get('username') or body.get('name', '')).strip()
                phone = str(body.get('phone', '')).strip()
                email = str(body.get('email', '')).strip()
                password = str(body.get('password', '')).strip()

                if not phone: return self.respond_json({'success': False, 'message': 'ফোন নাম্বার প্রদান করুন'}, 400)
                if not username: username = phone
                if not password: return self.respond_json({'success': False, 'message': 'পাসওয়ার্ড প্রদান করুন'}, 400)

                database = get_db()
                if database.users.find_one({"phone": phone}):
                    return self.respond_json({'success': False, 'message': 'এই ফোন নাম্বার দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা হয়েছে'}, 400)
                if email and database.users.find_one({"email": email}):
                    return self.respond_json({'success': False, 'message': 'এই ইমেইল এড্রেস দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা হয়েছে'}, 400)

                user_id = generate_id()
                user = {
                    "id": user_id,
                    "phone": phone,
                    "password": password,
                    "username": username,
                    "email": email,
                    "is_verified": 0,
                    "created_at": datetime.datetime.utcnow().isoformat()
                }
                database.users.insert_one(user.copy())

                card_num = generate_card_number()
                cvv = generate_cvv()
                expiry = generate_expiry()
                card = {
                    "id": generate_id(),
                    "user_id": user_id,
                    "card_number": card_num,
                    "cvv": cvv,
                    "expiry_date": expiry,
                    "balance": 0.00,
                    "status": "inactive",
                    "created_at": datetime.datetime.utcnow().isoformat()
                }
                database.cards.insert_one(card.copy())

                user.pop('_id', None)
                card.pop('_id', None)
                return self.respond_json({
                    'success': True,
                    'message': 'রেজিস্ট্রেশন সফল হয়েছে! গুডপে-তে স্বাগতম।',
                    'user': user,
                    'card': card
                })

            elif path == '/api/auth/login':
                identifier = str(body.get('identifier') or body.get('phone') or body.get('email', '')).strip()
                password = str(body.get('password', '')).strip()

                if not identifier or not password:
                    return self.respond_json({'success': False, 'message': 'ফোন/ইমেইল ও পাসওয়ার্ড প্রদান করুন'}, 400)

                database = get_db()
                user = database.users.find_one({
                    "$or": [{"phone": identifier}, {"email": identifier}, {"username": identifier}],
                    "password": password
                }, {"_id": 0})

                if not user:
                    return self.respond_json({'success': False, 'message': 'ভুল ফোন/ইমেইল অথবা পাসওয়ার্ড!'}, 401)

                card = database.cards.find_one({"user_id": user["id"]}, {"_id": 0})
                user.pop('password', None)

                return self.respond_json({
                    'success': True,
                    'message': 'সফলভাবে লগইন হয়েছে!',
                    'user': user,
                    'card': card
                })

            elif path == '/api/user/buy-card':
                user_id = body.get('user_id')
                full_name = str(body.get('full_name', '')).strip()
                phone_number = str(body.get('phone_number', '')).strip()
                payment_method = str(body.get('payment_method', '')).strip()
                sender_number = str(body.get('sender_number', '')).strip()

                if not user_id or not full_name or not sender_number or not payment_method:
                    return self.respond_json({'success': False, 'message': 'সকল তথ্য সঠিকভাবে পূরণ করুন'}, 400)

                database = get_db()
                settings = database.mfs_settings.find_one({"id": 1})
                rate = float(settings.get('usd_to_bdt_rate', 135))
                act_usd = float(settings.get('card_activation_fee_usd', 8))
                card_price = round(act_usd * rate, 2)

                database.card_purchases.insert_one({
                    "id": generate_id(),
                    "user_id": int(user_id),
                    "full_name": full_name,
                    "phone_number": phone_number,
                    "card_price": card_price,
                    "payment_method": payment_method,
                    "sender_number": sender_number,
                    "status": "pending",
                    "created_at": datetime.datetime.utcnow().isoformat()
                })

                database.cards.update_one({"user_id": int(user_id)}, {"$set": {"status": "processing"}})
                return self.respond_json({'success': True, 'message': f'কার্ড অ্যাক্টিভেশন ফি (${act_usd:.2f} / {card_price} BDT) আবেদন সফল হয়েছে।'})

            elif path == '/api/user/recharge':
                user_id = body.get('user_id')
                usd_amount = float(body.get('usd_amount', 0))
                payment_method = str(body.get('payment_method', '')).strip()
                sender_number = str(body.get('sender_number', '')).strip()

                if not user_id or usd_amount <= 0 or not sender_number or not payment_method:
                    return self.respond_json({'success': False, 'message': 'সঠিক পরিমাণ ও নাম্বার প্রদান করুন'}, 400)

                database = get_db()
                settings = database.mfs_settings.find_one({"id": 1})
                rate = float(settings.get('usd_to_bdt_rate', 135))
                charge_pct = float(settings.get('cashout_charge_pct', 2))
                total_bdt = round((usd_amount * rate) * (1 + charge_pct / 100.0), 2)

                database.recharges.insert_one({
                    "id": generate_id(),
                    "user_id": int(user_id),
                    "usd_amount": usd_amount,
                    "exchange_rate": rate,
                    "cashout_charge_pct": charge_pct,
                    "total_bdt": total_bdt,
                    "payment_method": payment_method,
                    "sender_number": sender_number,
                    "status": "pending",
                    "created_at": datetime.datetime.utcnow().isoformat()
                })

                return self.respond_json({'success': True, 'message': 'ধন্যবাদ খুব শীঘ্রই ডলার যোগ হবে', 'total_bdt': total_bdt})

            elif path == '/api/user/update-profile':
                user_id = body.get('user_id')
                field = body.get('field')
                value = str(body.get('value', '')).strip()

                if not user_id or not field or not value:
                    return self.respond_json({'success': False, 'message': 'তথ্য সঠিকভাবে পূরণ করুন'}, 400)

                database = get_db()
                if field == 'password' and len(value) < 6:
                    return self.respond_json({'success': False, 'message': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'}, 400)
                
                if field in ['password', 'email', 'username']:
                    database.users.update_one({"id": int(user_id)}, {"$set": {field: value}})

                return self.respond_json({'success': True, 'message': 'তথ্য আপডেট করা হয়েছে'})

            elif path == '/api/admin/login':
                username = str(body.get('username', '')).strip()
                password = str(body.get('password', '')).strip()

                database = get_db()
                admin = database.admin_users.find_one({"username": username, "password": password}, {"_id": 0})
                if admin:
                    return self.respond_json({'success': True, 'admin': admin})
                return self.respond_json({'success': False, 'message': 'এডমিন ইউজারনেম বা পাসওয়ার্ড ভুল'}, 401)

            elif path == '/api/admin/requests/approve':
                request_type = body.get('request_type')
                request_id = int(body.get('request_id'))
                database = get_db()

                if request_type == 'card_purchase':
                    cp = database.card_purchases.find_one({"id": request_id})
                    if cp:
                        settings = database.mfs_settings.find_one({"id": 1})
                        credit_usd = float(settings.get('card_balance_credit_usd', 5))
                        database.card_purchases.update_one({"id": request_id}, {"$set": {"status": "approved"}})
                        database.cards.update_one({"user_id": cp["user_id"]}, {"$set": {"status": "active"}, "$inc": {"balance": credit_usd}})
                        return self.respond_json({'success': True, 'message': f'কার্ড অ্যাক্টিভ হয়েছে। ${credit_usd:.2f} ব্যালেন্স যোগ হয়েছে।'})
                elif request_type == 'recharge':
                    r = database.recharges.find_one({"id": request_id})
                    if r:
                        database.recharges.update_one({"id": request_id}, {"$set": {"status": "approved"}})
                        database.cards.update_one({"user_id": r["user_id"]}, {"$inc": {"balance": r['usd_amount']}})
                        return self.respond_json({'success': True, 'message': 'রিচার্জ অ্যাপ্রুভ করা হয়েছে'})
                
                return self.respond_json({'success': False, 'message': 'আবেদন পাওয়া যায়নি'}, 404)

            elif path == '/api/admin/requests/reject':
                request_type = body.get('request_type')
                request_id = int(body.get('request_id'))
                database = get_db()

                if request_type == 'card_purchase':
                    cp = database.card_purchases.find_one({"id": request_id})
                    if cp:
                        database.card_purchases.update_one({"id": request_id}, {"$set": {"status": "rejected"}})
                        database.cards.update_one({"user_id": cp["user_id"]}, {"$set": {"status": "unpurchased"}})
                        return self.respond_json({'success': True, 'message': 'কার্ড ক্রয়ের আবেদন বাতিল করা হয়েছে'})
                elif request_type == 'recharge':
                    database.recharges.update_one({"id": request_id}, {"$set": {"status": "rejected"}})
                    return self.respond_json({'success': True, 'message': 'রিচার্জ বাতিল করা হয়েছে'})
                
                return self.respond_json({'success': False, 'message': 'আবেদন পাওয়া যায়নি'}, 404)

            elif path == '/api/admin/users/bulk-delete':
                user_ids = body.get('user_ids', [])
                if not user_ids: return self.respond_json({'success': False, 'message': 'কোনো ইউজার নির্বাচন করা হয়নি'}, 400)
                clean_ids = [int(uid) for uid in user_ids]
                database = get_db()
                
                database.cards.delete_many({"user_id": {"$in": clean_ids}})
                database.recharges.delete_many({"user_id": {"$in": clean_ids}})
                database.card_purchases.delete_many({"user_id": {"$in": clean_ids}})
                database.users.delete_many({"id": {"$in": clean_ids}})

                return self.respond_json({'success': True, 'message': f'সফলভাবে {len(clean_ids)} জন ইউজার মুছে ফেলা হয়েছে'})

            elif path == '/api/admin/requests/bulk-delete':
                items = body.get('items', [])
                if not items: return self.respond_json({'success': False, 'message': 'কোনো রিকোয়েস্ট নির্বাচন করা হয়নি'}, 400)

                rech_ids = [int(it['id']) for it in items if (it.get('type') or it.get('request_type')) == 'recharge']
                purch_ids = [int(it['id']) for it in items if (it.get('type') or it.get('request_type')) == 'card_purchase']

                database = get_db()
                if rech_ids: database.recharges.delete_many({"id": {"$in": rech_ids}})
                if purch_ids: database.card_purchases.delete_many({"id": {"$in": purch_ids}})

                return self.respond_json({'success': True, 'message': f'সফলভাবে {len(rech_ids) + len(purch_ids)} টি রিকোয়েস্ট মুছে ফেলা হয়েছে'})

            elif path == '/api/admin/user-update':
                user_id = int(body.get('user_id'))
                username = body.get('username')
                phone = body.get('phone')
                email = body.get('email')
                password = body.get('password')
                is_verified = int(body.get('is_verified', 0))
                
                card_number = body.get('card_number')
                cvv = body.get('cvv')
                expiry_date = body.get('expiry_date')
                balance = float(body.get('balance', 0))
                card_status = body.get('card_status')

                database = get_db()
                try:
                    database.users.update_one({"id": user_id}, {"$set": {
                        "username": username, "phone": phone, "email": email, 
                        "password": password, "is_verified": is_verified
                    }})
                    database.cards.update_one({"user_id": user_id}, {"$set": {
                        "card_number": card_number, "cvv": cvv, 
                        "expiry_date": expiry_date, "balance": balance, "status": card_status
                    }})
                    return self.respond_json({'success': True, 'message': 'ইউজার ও কার্ডের তথ্য সফলভাবে আপডেট করা হয়েছে'})
                except DuplicateKeyError:
                    return self.respond_json({'success': False, 'message': 'এই ফোন নাম্বার দিয়ে অন্য একটি একাউন্ট ইতিমধ্যে রয়েছে'}, 400)

            elif path == '/api/admin/mfs-update':
                database = get_db()
                database.mfs_settings.update_one({"id": 1}, {"$set": {
                    "bkash_number": body.get('bkash_number'),
                    "nagad_number": body.get('nagad_number'),
                    "rocket_number": body.get('rocket_number'),
                    "card_price_bdt": float(body.get('card_price_bdt', 1350)),
                    "usd_to_bdt_rate": float(body.get('usd_to_bdt_rate', 135)),
                    "cashout_charge_pct": float(body.get('cashout_charge_pct', 2)),
                    "card_activation_fee_usd": float(body.get('card_activation_fee_usd', 8)),
                    "card_balance_credit_usd": float(body.get('card_balance_credit_usd', 5)),
                    "updated_at": datetime.datetime.utcnow().isoformat()
                }}, upsert=True)
                return self.respond_json({'success': True, 'message': 'MFS সেটিংস আপডেট করা হয়েছে'})

            return self.respond_json({'success': False, 'message': 'Invalid endpoint'}, 404)
        except Exception as e:
            traceback.print_exc()
            return self.respond_json({'success': False, 'message': f'Server error: {str(e)}'}, 500)

class ThreadedGoodPayServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

if __name__ == '__main__':
    print(f"GoodPay Python Server running at http://localhost:{PORT}")
    try:
        httpd = ThreadedGoodPayServer(("", PORT), GoodPayHandler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()
