<!-- src/routes/+layout.svelte -->
<script>
  // Pull in your global styles:
  import '@fontsource-variable/lexend';
  import '@fontsource-variable/public-sans';
  import '../app.css';
</script>

<!--
  Optionally wrap with your own header/nav here,
  or just slot in the routed pages:
-->
<slot />
