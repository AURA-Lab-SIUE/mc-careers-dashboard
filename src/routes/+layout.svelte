<!-- src/routes/+layout.svelte -->
<script>
  // Self-hosted fonts (no external Google Fonts request):
  import '@fontsource-variable/lexend';
  import '@fontsource-variable/public-sans';
  // Pull in your global styles:
  import '../app.css';
</script>

<!--
  Optionally wrap with your own header/nav here,
  or just slot in the routed pages:
-->
<slot />
