#include "FabelBattlerGameMode.h"

#include "BattleSimActor.h"

AFabelBattlerGameMode::AFabelBattlerGameMode()
{
	DefaultPawnClass = nullptr;
}

void AFabelBattlerGameMode::BeginPlay()
{
	Super::BeginPlay();
	GetWorld()->SpawnActor<ABattleSimActor>(ABattleSimActor::StaticClass(),
		FVector::ZeroVector, FRotator::ZeroRotator);
}
