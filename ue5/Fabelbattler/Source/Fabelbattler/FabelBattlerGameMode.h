#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "FabelBattlerGameMode.generated.h"

UCLASS()
class FABELBATTLER_API AFabelBattlerGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	AFabelBattlerGameMode();

	virtual void BeginPlay() override;
};
