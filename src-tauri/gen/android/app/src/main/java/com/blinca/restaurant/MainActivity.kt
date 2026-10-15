package com.blinca.restaurant

import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  /** Space taken by the status bar, camera cutout and navigation bar, in CSS pixels, as JSON. */
  @Volatile private var safeArea = """{"top":0,"right":0,"bottom":0,"left":0}"""

  override fun onCreate(savedInstanceState: Bundle?) {
    // The app draws behind the system bars. Its UI is always light, so keep dark bar icons even in dark mode.
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
      navigationBarStyle = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
    )
    // Let the system put a translucent backing behind 3-button navigation (gesture navigation stays clear).
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) window.isNavigationBarContrastEnforced = true
    super.onCreate(savedInstanceState)
  }

  /**
   * Passes the safe area to the page as --native-inset-* CSS variables (see src/app.html and src/app.css).
   * Not every Android WebView reports env(safe-area-inset-*) when drawing edge to edge, so this is the
   * reliable source; the page uses whichever of the two is larger.
   */
  override fun onWebViewCreate(webView: WebView) {
    // Read by the page as soon as it starts.
    webView.addJavascriptInterface(SafeAreaBridge(), "BlincaSafeArea")

    // Pushed to the page whenever the insets change: rotation, cutout side, navigation mode.
    ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
      val area = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
      val density = resources.displayMetrics.density
      safeArea = """{"top":${area.top / density},"right":${area.right / density},"bottom":${area.bottom / density},"left":${area.left / density}}"""
      (view as WebView).evaluateJavascript("window.__blincaSetSafeArea?.($safeArea)", null)
      // Still let the WebView handle the insets itself, so env(safe-area-inset-*) works where supported.
      ViewCompat.onApplyWindowInsets(view, insets)
    }
  }

  private inner class SafeAreaBridge {
    @JavascriptInterface
    fun get(): String = safeArea
  }
}
