# binaries
DOCKER_BIN=/usr/bin/docker


# Package metadata 
VERSION=$(cat ../package.json | jq -r ".version")
PACKAGE_NAME=$(cat ../package.json | jq -r ".name")


#Docker metadata
DOCKER_HUB_USERNAME=mgreif
IMAGE_NAME=$DOCKER_HUB_USERNAME/$PACKAGE_NAME:$VERSION


echo logging into docker hub;

$DOCKER_BIN login;

if [ $? -ne 0 ];
then
    echo failed logging into docker hub;
    exit 1
fi;


echo Checking for invalid or existing image ...



if $DOCKER_BIN image ls | awk '{split($0,a," "); print a[1]":"a[2]}' | grep -q $IMAGE_NAME;
then
    echo Image with name $IMAGE_NAME is already present;
    echo Maybe you forgot to update the version?;
    exit 1
fi;


echo Building image

$DOCKER_BIN build -t $IMAGE_NAME .

if [ $? -ne 0 ];
then
    echo failed building image;
    exit 1
fi;

echo Pushing $IMAGE_NAME to dockerhub;

$DOCKER_BIN push $IMAGE_NAME

if [ $? -ne 0 ];
then
    echo failed pushing the image to docker_hub;
    exit 1
fi;

echo Successfully pushed to docker hub
echo Exiting ...

exit 0


