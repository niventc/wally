cd ./client
npm ci
npm run build
cd ../server
npm ci
npm run package

cd ..
rm -rf ./dist
mkdir dist
mkdir ./dist/client

cp ./server/dist/* ./dist
cp -r ./client/build/* ./dist/client