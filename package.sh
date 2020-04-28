cd ./client
npm run build
cd ../server
npm run package

cd ..
rm -rf ./dist
mkdir dist
mkdir ./dist/client

cp ./server/dist/* ./dist
cp -r ./client/build/* ./dist/client