package com.cre8torcut.mobile;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 1201;
    private WebView webView;
    private ValueCallback<Uri[]> pendingFiles;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            buildWebView();
            hideNavigationBar();
        } catch (Throwable t) {
            showFatal("Cre8torCut could not start", t);
        }
    }

    private void buildWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(3, 5, 10));
        setContentView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (pendingFiles != null) {
                    pendingFiles.onReceiveValue(null);
                }
                pendingFiles = filePathCallback;
                try {
                    Intent intent = createMediaChooserIntent(fileChooserParams);
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Throwable t) {
                    pendingFiles.onReceiveValue(null);
                    pendingFiles = null;
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onReceivedError(WebView view,
                                        WebResourceRequest request,
                                        WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    String description = error == null ? "Unknown WebView error" : String.valueOf(error.getDescription());
                    showMessage("Cre8torCut page error\n\n" + description);
                }
            }

            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                showMessage("Cre8torCut WebView renderer stopped.\n\nPlease report that this diagnostic screen appeared.");
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void hideNavigationBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
        }
    }

    private Intent createMediaChooserIntent(WebChromeClient.FileChooserParams params) {
        Intent getContentIntent = createFileIntent(Intent.ACTION_GET_CONTENT, params, false);
        Intent openDocumentIntent = createFileIntent(Intent.ACTION_OPEN_DOCUMENT, params, true);

        Intent chooser = Intent.createChooser(getContentIntent, "Choose media source");
        chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{openDocumentIntent});
        return chooser;
    }

    private Intent createFileIntent(String action,
                                    WebChromeClient.FileChooserParams params,
                                    boolean persistableAccess) {
        Intent intent = new Intent(action);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        if (persistableAccess) {
            intent.addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        }
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
                params != null && params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE);

        Set<String> mimeTypes = new LinkedHashSet<>();
        if (params != null && params.getAcceptTypes() != null) {
            for (String accept : params.getAcceptTypes()) {
                if (accept == null) continue;
                for (String token : accept.split(",")) {
                    String value = token.trim().toLowerCase();
                    if (value.contains("/") && !value.startsWith(".")) {
                        mimeTypes.add(value);
                    }
                }
            }
        }

        if (mimeTypes.isEmpty()) {
            intent.setType("*/*");
        } else if (mimeTypes.size() == 1) {
            intent.setType(mimeTypes.iterator().next());
        } else {
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes.toArray(new String[0]));
        }
        return intent;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || pendingFiles == null) {
            hideNavigationBar();
            return;
        }

        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            List<Uri> selected = new ArrayList<>();
            ClipData clipData = data.getClipData();
            if (clipData != null) {
                for (int i = 0; i < clipData.getItemCount(); i++) {
                    Uri uri = clipData.getItemAt(i).getUri();
                    if (uri != null) selected.add(uri);
                }
            } else if (data.getData() != null) {
                selected.add(data.getData());
            }

            for (Uri uri : selected) {
                try {
                    getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } catch (SecurityException ignored) {
                    // ACTION_GET_CONTENT and some providers grant temporary read access only.
                    // That is still valid for Cre8torCut's current import session.
                }
            }
            if (!selected.isEmpty()) {
                result = selected.toArray(new Uri[0]);
            }
        }

        pendingFiles.onReceiveValue(result);
        pendingFiles = null;
        hideNavigationBar();
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideNavigationBar();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideNavigationBar();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (pendingFiles != null) {
            pendingFiles.onReceiveValue(null);
            pendingFiles = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private void showFatal(String heading, Throwable t) {
        StringBuilder message = new StringBuilder(heading);
        message.append("\n\n").append(t.getClass().getName());
        if (t.getMessage() != null) {
            message.append("\n").append(t.getMessage());
        }
        showMessage(message.toString());
    }

    private void showMessage(String message) {
        TextView text = new TextView(this);
        text.setText(message);
        text.setTextColor(Color.WHITE);
        text.setBackgroundColor(Color.rgb(3, 5, 10));
        text.setTextSize(16f);
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        text.setPadding(pad, pad, pad, pad);
        setContentView(text);
    }
}
