<?php
/**
 * Copy this file to the directory ABOVE public_html and name it cosmix-config.php.
 * On Hostinger that is the account home, next to public_html:
 *   /home/USER/cosmix-config.php
 * From public_html the path is ../cosmix-config.php.
 *
 * Do not upload the filled file into public_html. Leave the values empty until
 * the Hub host has issued them. The forms then ask the visitor to use WhatsApp.
 *
 * The Turnstile secret stays on the Hub host. The site key, if you use one,
 * is PUBLIC_TURNSTILE_SITE_KEY at build time.
 */
return [
    'HUB_BASE_URL' => '',
    'HUB_API_KEY' => '',
    'HUB_HMAC_SECRET' => '',
];
