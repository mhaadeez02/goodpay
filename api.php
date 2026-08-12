<?php
// GoodPay v2.0.0.1 - PHP REST API Endpoint
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
$pdo = getPdoConnection();

// Auto-initialize SQLite tables if missing
$pdo->exec("
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    card_number VARCHAR(19) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    expiry_date VARCHAR(7) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 5.00,
    status VARCHAR(20) DEFAULT 'unpurchased',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS recharges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    usd_amount DECIMAL(10,2) NOT NULL,
    exchange_rate DECIMAL(10,2) NOT NULL,
    cashout_charge_pct DECIMAL(5,2) NOT NULL,
    total_bdt DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    sender_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS card_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    card_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    sender_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS mfs_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bkash_number VARCHAR(20) DEFAULT '01794146475',
    nagad_number VARCHAR(20) DEFAULT '01794146475',
    rocket_number VARCHAR(20) DEFAULT '01794146475',
    card_price_bdt DECIMAL(10,2) DEFAULT 1350.00,
    usd_to_bdt_rate DECIMAL(10,2) DEFAULT 135.00,
    cashout_charge_pct DECIMAL(5,2) DEFAULT 2.00,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT 'Admin Masud'
);
");

// Seed defaults
$stmt = $pdo->query("SELECT COUNT(*) as count FROM mfs_settings");
if ($stmt->fetch()['count'] == 0) {
    $pdo->exec("INSERT INTO mfs_settings (id, bkash_number, nagad_number, rocket_number, card_price_bdt, usd_to_bdt_rate, cashout_charge_pct) VALUES (1, '01794146475', '01794146475', '01794146475', 1350.00, 135.00, 2.00)");
}
$stmt = $pdo->query("SELECT COUNT(*) as count FROM admin_users");
if ($stmt->fetch()['count'] == 0) {
    $pdo->exec("INSERT INTO admin_users (id, username, password, name) VALUES (1, 'masud', '1516797685', 'Masud Admin')");
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function genCardNumber() {
    return "4532 " . rand(1000, 9999) . " " . rand(1000, 9999) . " " . rand(1000, 9999);
}

function genExpiry() {
    $m = sprintf("%02d", date('n'));
    $y = (date('Y') + 5) % 100;
    return "$m/$y";
}

switch ($action) {
    case 'mfs_settings':
        $stmt = $pdo->query("SELECT * FROM mfs_settings WHERE id = 1");
        $row = $stmt->fetch();
        sendJson(['success' => true, 'data' => $row]);
        break;

    case 'register':
        $phone = trim($input['phone'] ?? '');
        $password = trim($input['password'] ?? '');

        if (!$phone) sendJson(['success' => false, 'message' => 'ফোন নাম্বার প্রদান করুন'], 400);
        if (strlen($password) < 6) sendJson(['success' => false, 'message' => 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'], 400);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (phone, password, username) VALUES (?, ?, ?)");
            $stmt->execute([$phone, $password, $phone]);
            $userId = $pdo->lastInsertId();

            $cardNum = genCardNumber();
            $cvv = (string)rand(100, 999);
            $expiry = genExpiry();

            $stmtCard = $pdo->prepare("INSERT INTO cards (user_id, card_number, cvv, expiry_date, balance, status) VALUES (?, ?, ?, ?, 5.00, 'unpurchased')");
            $stmtCard->execute([$userId, $cardNum, $cvv, $expiry]);

            $card = $pdo->query("SELECT * FROM cards WHERE user_id = $userId")->fetch();
            sendJson([
                'success' => true,
                'message' => 'রেজিস্ট্রেশন সফল হয়েছে',
                'user' => ['id' => $userId, 'phone' => $phone, 'username' => $phone, 'email' => '', 'is_verified' => 0],
                'card' => $card
            ]);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'message' => 'এই ফোন নাম্বার দিয়ে ইতিমধ্যে একাউন্ট রয়েছে'], 400);
        }
        break;

    case 'login':
        $phone = trim($input['phone'] ?? '');
        $password = trim($input['password'] ?? '');

        $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ? AND password = ?");
        $stmt->execute([$phone, $password]);
        $user = $stmt->fetch();

        if (!$user) sendJson(['success' => false, 'message' => 'ফোন নাম্বার বা পাসওয়ার্ড ভুল হয়েছে'], 401);

        $card = $pdo->query("SELECT * FROM cards WHERE user_id = {$user['id']}")->fetch();
        sendJson([
            'success' => true,
            'message' => 'লগইন সফল হয়েছে',
            'user' => $user,
            'card' => $card
        ]);
        break;

    case 'user_profile':
        $userId = $_GET['user_id'] ?? 0;
        $user = $pdo->query("SELECT id, phone, username, email, is_verified, created_at FROM users WHERE id = $userId")->fetch();
        if (!$user) sendJson(['success' => false, 'message' => 'ইউজার পাওয়া যায়নি'], 404);
        $card = $pdo->query("SELECT * FROM cards WHERE user_id = $userId")->fetch();
        sendJson(['success' => true, 'user' => $user, 'card' => $card]);
        break;

    case 'buy_card':
        $userId = $input['user_id'] ?? 0;
        $fullName = trim($input['full_name'] ?? '');
        $phoneNumber = trim($input['phone_number'] ?? '');
        $method = trim($input['payment_method'] ?? '');
        $sender = trim($input['sender_number'] ?? '');

        if (!$userId || !$fullName || !$method || !$sender) {
            sendJson(['success' => false, 'message' => 'সকল তথ্য পূরণ করুন'], 400);
        }

        $mfs = $pdo->query("SELECT card_price_bdt FROM mfs_settings WHERE id = 1")->fetch();
        $price = $mfs ? $mfs['card_price_bdt'] : 1390.00;

        $stmt = $pdo->prepare("INSERT INTO card_purchases (user_id, full_name, phone_number, card_price, payment_method, sender_number, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$userId, $fullName, $phoneNumber, $price, $method, $sender]);

        $pdo->exec("UPDATE cards SET status = 'processing' WHERE user_id = $userId");
        sendJson(['success' => true, 'message' => 'কার্ড ক্রয়ের আবেদন সফল হয়েছে। খুব শীঘ্রই আপনার কার্ড টি এক্টিভ হবে']);
        break;

    case 'recharge':
        $userId = $input['user_id'] ?? 0;
        $usd = floatval($input['usd_amount'] ?? 0);
        $method = trim($input['payment_method'] ?? '');
        $sender = trim($input['sender_number'] ?? '');

        if (!$userId || $usd <= 0 || !$method || !$sender) {
            sendJson(['success' => false, 'message' => 'সঠিক পরিমাণ ও বিস্তারিত প্রদান করুন'], 400);
        }

        $mfs = $pdo->query("SELECT usd_to_bdt_rate, cashout_charge_pct FROM mfs_settings WHERE id = 1")->fetch();
        $rate = $mfs ? floatval($mfs['usd_to_bdt_rate']) : 135.00;
        $chargePct = $mfs ? floatval($mfs['cashout_charge_pct']) : 2.00;

        $totalBdt = round(($usd * $rate) * (1 + $chargePct / 100.0), 2);

        $stmt = $pdo->prepare("INSERT INTO recharges (user_id, usd_amount, exchange_rate, cashout_charge_pct, total_bdt, payment_method, sender_number, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$userId, $usd, $rate, $chargePct, $totalBdt, $method, $sender]);

        sendJson(['success' => true, 'message' => 'ধন্যবাদ খুব শীঘ্রই ডলার যোগ হবে', 'total_bdt' => $totalBdt]);
        break;

    case 'user_history':
        $userId = $_GET['user_id'] ?? 0;
        $stmt = $pdo->prepare("
            SELECT 'recharge' as type, id, usd_amount as amount, total_bdt, payment_method, sender_number, status, created_at
            FROM recharges WHERE user_id = ?
            UNION ALL
            SELECT 'card_purchase' as type, id, card_price as amount, card_price as total_bdt, payment_method, sender_number, status, created_at
            FROM card_purchases WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$userId, $userId]);
        sendJson(['success' => true, 'transactions' => $stmt->fetchAll()]);
        break;

    case 'update_profile':
        $userId = $input['user_id'] ?? 0;
        $field = $input['field'] ?? '';
        $value = trim($input['value'] ?? '');

        if ($field === 'password') {
            if (strlen($value) < 6) sendJson(['success' => false, 'message' => 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'], 400);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$value, $userId]);
        } elseif ($field === 'email') {
            $stmt = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
            $stmt->execute([$value, $userId]);
        }
        sendJson(['success' => true, 'message' => 'তথ্য পরিবর্তন করা হয়েছে']);
        break;

    case 'admin_login':
        $u = trim($input['username'] ?? '');
        $p = trim($input['password'] ?? '');
        $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ? AND password = ?");
        $stmt->execute([$u, $p]);
        $admin = $stmt->fetch();
        if ($admin) sendJson(['success' => true, 'admin' => $admin]);
        sendJson(['success' => false, 'message' => 'এডমিন ইউজারনেম বা পাসওয়ার্ড ভুল'], 401);
        break;

    case 'admin_users':
        $stmt = $pdo->query("
            SELECT u.id, u.phone, u.username, u.email, u.is_verified, u.created_at,
                   c.card_number, c.cvv, c.expiry_date, c.balance, c.status as card_status
            FROM users u LEFT JOIN cards c ON u.id = c.user_id ORDER BY u.id DESC
        ");
        sendJson(['success' => true, 'users' => $stmt->fetchAll()]);
        break;

    case 'admin_user_details':
        $userId = $_GET['user_id'] ?? 0;
        $user = $pdo->query("SELECT * FROM users WHERE id = $userId")->fetch();
        $card = $pdo->query("SELECT * FROM cards WHERE user_id = $userId")->fetch();
        $hist = $pdo->query("
            SELECT 'recharge' as type, id, usd_amount as amount, total_bdt, payment_method, sender_number, status, created_at FROM recharges WHERE user_id = $userId
            UNION ALL
            SELECT 'card_purchase' as type, id, card_price as amount, card_price as total_bdt, payment_method, sender_number, status, created_at FROM card_purchases WHERE user_id = $userId
            ORDER BY created_at DESC
        ")->fetchAll();
        sendJson(['success' => true, 'user' => $user, 'card' => $card, 'history' => $hist]);
        break;

    case 'admin_requests':
        $requests = $pdo->query("
            SELECT 'card_purchase' as request_type, cp.id, cp.user_id, cp.full_name, cp.phone_number, cp.card_price, 
                   NULL as usd_amount, cp.card_price as total_bdt, cp.payment_method, cp.sender_number, cp.status, cp.created_at,
                   u.phone as user_phone
            FROM card_purchases cp JOIN users u ON cp.user_id = u.id
            UNION ALL
            SELECT 'recharge' as request_type, r.id, r.user_id, u.username as full_name, u.phone as phone_number, NULL as card_price,
                   r.usd_amount, r.total_bdt, r.payment_method, r.sender_number, r.status, r.created_at,
                   u.phone as user_phone
            FROM recharges r JOIN users u ON r.user_id = u.id
            ORDER BY created_at DESC
        ")->fetchAll();
        sendJson(['success' => true, 'requests' => $requests]);
        break;

    case 'admin_approve':
        $type = $input['request_type'] ?? '';
        $reqId = $input['request_id'] ?? 0;

        if ($type === 'card_purchase') {
            $cp = $pdo->query("SELECT * FROM card_purchases WHERE id = $reqId")->fetch();
            if ($cp) {
                $pdo->exec("UPDATE card_purchases SET status = 'approved' WHERE id = $reqId");
                $pdo->exec("UPDATE cards SET status = 'active' WHERE user_id = {$cp['user_id']}");
                sendJson(['success' => true, 'message' => 'কার্ড ক্রয়ের আবেদন অনুমোদন করা হয়েছে']);
            }
        } elseif ($type === 'recharge') {
            $r = $pdo->query("SELECT * FROM recharges WHERE id = $reqId")->fetch();
            if ($r) {
                $pdo->exec("UPDATE recharges SET status = 'approved' WHERE id = $reqId");
                $pdo->exec("UPDATE cards SET balance = balance + {$r['usd_amount']} WHERE user_id = {$r['user_id']}");
                sendJson(['success' => true, 'message' => 'রিচার্জ অনুমোদন করা হয়েছে']);
            }
        }
        sendJson(['success' => false, 'message' => 'আবেদন পাওয়া যায়নি'], 404);
        break;

    case 'admin_reject':
        $type = $input['request_type'] ?? '';
        $reqId = $input['request_id'] ?? 0;

        if ($type === 'card_purchase') {
            $cp = $pdo->query("SELECT * FROM card_purchases WHERE id = $reqId")->fetch();
            if ($cp) {
                $pdo->exec("UPDATE card_purchases SET status = 'rejected' WHERE id = $reqId");
                $pdo->exec("UPDATE cards SET status = 'unpurchased' WHERE user_id = {$cp['user_id']}");
                sendJson(['success' => true, 'message' => 'কার্ড ক্রয়ের আবেদন বাতিল করা হয়েছে']);
            }
        } elseif ($type === 'recharge') {
            $pdo->exec("UPDATE recharges SET status = 'rejected' WHERE id = $reqId");
            sendJson(['success' => true, 'message' => 'রিচার্জ বাতিল করা হয়েছে']);
        }
        sendJson(['success' => false, 'message' => 'আবেদন পাওয়া যায়নি'], 404);
        break;

    case 'admin_users_bulk_delete':
        $userIds = $input['user_ids'] ?? [];
        if (!is_array($userIds) || empty($userIds)) {
            sendJson(['success' => false, 'message' => 'কোনো ইউজার নির্বাচন করা হয়নি'], 400);
        }
        $cleanIds = array_values(array_filter(array_map('intval', $userIds)));
        if (empty($cleanIds)) {
            sendJson(['success' => false, 'message' => 'সঠিক ইউজার আইডি প্রদান করুন'], 400);
        }
        $in = implode(',', array_fill(0, count($cleanIds), '?'));
        
        $pdo->prepare("DELETE FROM cards WHERE user_id IN ($in)")->execute($cleanIds);
        $pdo->prepare("DELETE FROM recharges WHERE user_id IN ($in)")->execute($cleanIds);
        $pdo->prepare("DELETE FROM card_purchases WHERE user_id IN ($in)")->execute($cleanIds);
        $pdo->prepare("DELETE FROM users WHERE id IN ($in)")->execute($cleanIds);
        
        sendJson(['success' => true, 'message' => 'সফলভাবে ' . count($cleanIds) . ' জন ইউজার ও তাদের ডাটা মুছে ফেলা হয়েছে']);
        break;

    case 'admin_requests_bulk_delete':
        $items = $input['items'] ?? [];
        if (!is_array($items) || empty($items)) {
            sendJson(['success' => false, 'message' => 'কোনো রিকোয়েস্ট নির্বাচন করা হয়নি'], 400);
        }
        $rechIds = [];
        $purchIds = [];
        foreach ($items as $it) {
            $type = $it['type'] ?? $it['request_type'] ?? '';
            $id = intval($it['id'] ?? 0);
            if ($type === 'recharge' && $id > 0) $rechIds[] = $id;
            if ($type === 'card_purchase' && $id > 0) $purchIds[] = $id;
        }

        if (!empty($rechIds)) {
            $in = implode(',', array_fill(0, count($rechIds), '?'));
            $pdo->prepare("DELETE FROM recharges WHERE id IN ($in)")->execute($rechIds);
        }
        if (!empty($purchIds)) {
            $in = implode(',', array_fill(0, count($purchIds), '?'));
            $pdo->prepare("DELETE FROM card_purchases WHERE id IN ($in)")->execute($purchIds);
        }

        $total = count($rechIds) + count($purchIds);
        sendJson(['success' => true, 'message' => "সফলভাবে $total টি রিকোয়েস্ট হিস্ট্রি মুছে ফেলা হয়েছে"]);
        break;

    case 'admin_user_update':
        $userId = $input['user_id'] ?? 0;
        try {
            $stmtUser = $pdo->prepare("UPDATE users SET username = ?, phone = ?, email = ?, password = ?, is_verified = ? WHERE id = ?");
            $stmtUser->execute([$input['username'], $input['phone'], $input['email'], $input['password'], $input['is_verified'], $userId]);

            $stmtCard = $pdo->prepare("UPDATE cards SET card_number = ?, cvv = ?, expiry_date = ?, balance = ?, status = ? WHERE user_id = ?");
            $stmtCard->execute([$input['card_number'], $input['cvv'], $input['expiry_date'], $input['balance'], $input['card_status'], $userId]);

            sendJson(['success' => true, 'message' => 'ইউজারের তথ্য সফলভাবে আপডেট করা হয়েছে']);
        } catch (PDOException $e) {
            sendJson(['success' => false, 'message' => 'এই ফোন নাম্বার দিয়ে অন্য একটি একাউন্ট রয়েছে'], 400);
        }
        break;

    case 'admin_mfs_update':
        $stmt = $pdo->prepare("UPDATE mfs_settings SET bkash_number = ?, nagad_number = ?, rocket_number = ?, card_price_bdt = ?, usd_to_bdt_rate = ?, cashout_charge_pct = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1");
        $stmt->execute([$input['bkash_number'], $input['nagad_number'], $input['rocket_number'], $input['card_price_bdt'], $input['usd_to_bdt_rate'], $input['cashout_charge_pct']]);
        sendJson(['success' => true, 'message' => 'MFS সেটিংস আপডেট করা হয়েছে']);
        break;

    default:
        sendJson(['success' => false, 'message' => 'invalid action'], 404);
}
