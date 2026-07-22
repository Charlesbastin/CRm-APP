package com.technocraft.events;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        // Support modern web APIs
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Inject Android bridge for clipboard and UPI deep-link support
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // Handle permission requests (camera for QR scanner)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                return true; // Suppress console logs in release
            }
        });

        // Handle custom URL schemes (upi://, intent://)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                String scheme = request.getUrl().getScheme();

                // Handle UPI deep-links — open installed UPI app
                if ("upi".equals(scheme)) {
                    try {
                        Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        upiIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        if (upiIntent.resolveActivity(getPackageManager()) != null) {
                            startActivity(upiIntent);
                        } else {
                            Toast.makeText(MainActivity.this,
                                "No UPI app installed. Please install GPay, PhonePe, or Paytm.",
                                Toast.LENGTH_LONG).show();
                        }
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this,
                            "Could not open UPI app: " + e.getMessage(),
                            Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }

                // Handle intent:// scheme (some payment gateways)
                if ("intent".equals(scheme)) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        if (intent.resolveActivity(getPackageManager()) != null) {
                            startActivity(intent);
                        }
                    } catch (Exception e) {
                        // ignore
                    }
                    return true;
                }

                // Let http/https load in WebView
                if ("http".equals(scheme) || "https".equals(scheme) || "file".equals(scheme)) {
                    return false;
                }

                // For all other schemes, try opening with system
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                } catch (Exception e) {
                    // ignore
                }
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    /** JavaScript → Android bridge for clipboard and native features */
    public class AndroidBridge {
        @JavascriptInterface
        public void copyToClipboard(String text) {
            android.content.ClipboardManager clipboard =
                (android.content.ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
            android.content.ClipData clip =
                android.content.ClipData.newPlainText("UPI ID", text);
            clipboard.setPrimaryClip(clip);
            runOnUiThread(() ->
                Toast.makeText(MainActivity.this, "Copied: " + text, Toast.LENGTH_SHORT).show()
            );
        }

        @JavascriptInterface
        public String getVersion() {
            return "TechnoCraft 2026 v1.1";
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }
}
