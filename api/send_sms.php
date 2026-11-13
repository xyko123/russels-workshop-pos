<?php
/**
 * RUSELL'S GLASS, WOODS & METALS - SMS Gateway Integration
 * Semaphore SMS API for Philippine Mobile Numbers (Globe, Smart, DITO, TNT, TM)
 * University of Mindanao Digos College - BSIT Mini-Capstone System
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$apikey = $input['apikey'] ?? getenv('SEMAPHORE_API_KEY') ?: '';
$number = $input['number'] ?? '09922328650';
$message = $input['message'] ?? 'Rusell\'s Workshop: Your One-Time Password verification code is 123456.';
$sendername = $input['sendername'] ?? 'RUSELLSMART';

// Clean Philippine number format
$cleanNumber = preg_replace('/[^0-9]/', '', $number);
if (strlen($cleanNumber) === 10 && substr($cleanNumber, 0, 1) === '9') {
    $cleanNumber = '0' . $cleanNumber;
}

// If real Semaphore API key is provided, perform live HTTP POST
if (!empty($apikey) && strlen($apikey) > 10) {
    $ch = curl_init();
    $parameters = [
        'apikey' => $apikey,
        'number' => $cleanNumber,
        'message' => $message,
        'sendername' => $sendername
    ];
    curl_setopt($ch, CURLOPT_URL, 'https://api.semaphore.co/api/v4/messages');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($parameters));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $output = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        echo json_encode([
            'success' => false,
            'mode' => 'live_error',
            'error' => $err,
            'target' => $cleanNumber
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'mode' => 'live_semaphore',
            'response' => json_decode($output, true) ?? $output,
            'target' => $cleanNumber
        ]);
    }
    exit;
}

// Default High-Fidelity Simulation for Capstone Evaluation
echo json_encode([
    'success' => true,
    'mode' => 'simulated_gateway',
    'provider' => 'Semaphore PH / Philippine Carrier Network',
    'target' => $cleanNumber,
    'message_length' => strlen($message),
    'timestamp' => date('c'),
    'note' => 'Set SEMAPHORE_API_KEY to activate live carrier dispatch to ' . $cleanNumber
]);
