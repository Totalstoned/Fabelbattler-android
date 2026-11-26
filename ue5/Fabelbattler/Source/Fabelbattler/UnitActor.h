#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "UnitActor.generated.h"

class UStaticMeshComponent;

UCLASS()
class FABELBATTLER_API AUnitActor : public AActor
{
	GENERATED_BODY()

public:
	AUnitActor();

	virtual void Tick(float DeltaSeconds) override;

	void SetupTeam(bool bInHuman, const FString& InKey, const FVector& At);

	UPROPERTY(EditAnywhere, Category = "Unit")
	bool bHuman = true;

	UPROPERTY(EditAnywhere, Category = "Unit")
	FString UnitKey;

	UPROPERTY(VisibleAnywhere, Category = "Unit")
	float Health = 100.f;

private:
	UPROPERTY(VisibleAnywhere)
	TObjectPtr<UStaticMeshComponent> Mesh;

	float AttackCooldown = 0.f;

	AUnitActor* FindNearestEnemy() const;
};
