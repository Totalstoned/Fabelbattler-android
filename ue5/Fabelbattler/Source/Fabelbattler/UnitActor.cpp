#include "UnitActor.h"

#include "Components/StaticMeshComponent.h"
#include "EngineUtils.h"
#include "UObject/ConstructorHelpers.h"

AUnitActor::AUnitActor()
{
	PrimaryActorTick.bCanEverTick = true;
	Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	RootComponent = Mesh;

	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
	if (Cube.Succeeded())
	{
		Mesh->SetStaticMesh(Cube.Object);
	}
}

void AUnitActor::SetupTeam(bool bInHuman, const FString& InKey, const FVector& At)
{
	bHuman = bInHuman;
	UnitKey = InKey;
	Health = bHuman ? 60.f : 140.f;
	SetActorLocation(At);
	// Dieselbe Groessenordnung wie im WebView-Build: Menschen 0.27, Monster 0.45.
	SetActorScale3D(bHuman ? FVector(0.27f) : FVector(0.45f));
}

AUnitActor* AUnitActor::FindNearestEnemy() const
{
	AUnitActor* Best = nullptr;
	float BestDist = MAX_FLT;
	for (TActorIterator<AUnitActor> It(GetWorld()); It; ++It)
	{
		AUnitActor* Other = *It;
		if (!Other || Other == this || Other->bHuman == bHuman || Other->IsActorBeingDestroyed())
		{
			continue;
		}
		const float Dist = FVector::DistSquared(GetActorLocation(), Other->GetActorLocation());
		if (Dist < BestDist)
		{
			BestDist = Dist;
			Best = Other;
		}
	}
	return Best;
}

void AUnitActor::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	AttackCooldown -= DeltaSeconds;

	AUnitActor* Target = FindNearestEnemy();
	if (!Target)
	{
		return;
	}

	const FVector Delta = Target->GetActorLocation() - GetActorLocation();
	const float Dist = Delta.Size();
	if (Dist > 140.f)
	{
		const float Step = FMath::Min(160.f * DeltaSeconds, Dist - 130.f);
		AddActorWorldOffset(Delta.GetSafeNormal() * Step);
	}
	else if (AttackCooldown <= 0.f)
	{
		AttackCooldown = 0.6f;
		Target->Health -= bHuman ? 8.f : 14.f;
		if (Target->Health <= 0.f)
		{
			UE_LOG(LogTemp, Log, TEXT("Fabelbattler: %s faellt"), *Target->UnitKey);
			Target->Destroy();
		}
	}
}
