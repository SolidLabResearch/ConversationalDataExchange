
echo "This script assumes that the server runs on localhost:3456 and the client runs on localhost:2345"
echo ""
echo ""

echo ""
echo "##################################"
echo "Client sends 1-CtoS.n3s to Server"
echo "##################################"
echo ""

cat "1-CtoS.n3s"

curl -X POST curl -H "Content-Type: text/n3" --data-binary "@./1-CtoS.n3s" localhost:3456 > ./2-StoC.n3s

echo ""
echo "##################################"
echo "Server sends 2-StoC.n3s to Client"
echo "##################################"
echo ""
cat "2-StoC.n3s"

curl -X POST -H "Content-Type: text/n3" --data-binary "@./2-StoC.n3s" localhost:2345 > ./3-CtoS.n3s

echo ""
echo "##################################"
echo "Client sends 3-CtoS.n3s to Server"
echo "##################################"
echo ""
cat "3-CtoS.n3s"

curl -X POST -H "Content-Type: text/n3" --data-binary "@./3-CtoS.n3s" localhost:3456 > ./4-StoC.n3s

echo ""
echo "##################################"
echo "Server sends 4-StoC.n3s to Client"
echo "##################################"
echo ""
cat "4-StoC.n3s"