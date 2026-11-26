#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BattleSimActor.generated.h"

class AUnitActor;

UCLASS()
class FABELBATTLER_API ABattleSimActor : public AActor
{
	GENERATED_BODY()

public:
	ABattleSimActor();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;

	UPROPERTY(EditAnywhere, Category = "Wave")
	int32 Wave = 1;

	UPROPERTY(EditAnywhere, Category = "Wave")
	float WaveDuration = 20.f;

	UPROPERTY(VisibleAnywhere, Category = "Wave")
	int32 HumanCount = 0;

	UPROPERTY(VisibleAnywhere, Category = "Wave")
	int32 MonsterCount = 0;

private:
	float Elapsed = 0.f;
	TArray<FString> HumanKeys;
	TArray<FString> MonsterKeys;
	TArray<TObjectPtr<AUnitActor>> Spawned;

	void LoadUnitData();
	void SpawnWave();
};
